import { NextResponse } from "next/server";
import { auth, resolveSessionUserId, unauthorizedOrDatabaseError } from "@/auth";
import { sendDecisionDM } from "@/lib/discord-dm";
import { grantGangMemberDiscordRole } from "@/lib/job-discord-roles";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";
import { getClientIp } from "@/lib/request";

function canManageGangApps(adminType: string | null | undefined): boolean {
  return adminType === "jobs" || adminType === "full";
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const result = await resolveSessionUserId(session);
  if (!result.ok) return unauthorizedOrDatabaseError(result);
  const userId = result.userId;
  const discordId = (session?.user as { discordId?: string } | undefined)?.discordId ?? null;
  const ipAddress = getClientIp(request);
  const adminType = (session!.user as { adminType?: string | null }).adminType;
  if (!canManageGangApps(adminType)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await params;
  try {
    const body = await request.json();
    const { status, adminNotes } = body;
    if (!status || !["approved", "rejected"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }
    const application = await prisma.gangApplication.update({
      where: { id },
      data: {
        status,
        adminNotes: adminNotes ? String(adminNotes).trim() : null,
        reviewedBy: userId,
        reviewedAt: new Date(),
      },
      include: {
        user: true,
        reviewedByUser: { select: { username: true, avatar: true } },
      },
    });
    await sendDecisionDM(
      {
        type: "gang",
        user: application.user,
        adminNotes: application.adminNotes,
        reviewedAt: application.reviewedAt ?? null,
      },
      status
    ).catch((e) => console.error("[discord-dm] Gang application DM failed:", e));

    let discordRoleGranted: boolean | null = null;
    let discordRoleId: string | null = null;
    if (status === "approved" && application.user?.discordId) {
      const roleResult = await grantGangMemberDiscordRole(application.user.discordId).catch((e) => {
        console.error("[job-discord-roles] Gang member role grant failed:", e);
        return { granted: false, roleId: null };
      });
      discordRoleGranted = roleResult.granted;
      discordRoleId = roleResult.roleId;
      if (!roleResult.granted && roleResult.roleId) {
        console.warn(
          "[job-discord-roles] Gang member role was not assigned. Check bot permissions and that the user is in the server."
        );
      }
    }

    await createAuditLog({
      action: status === "approved" ? "gang_application_approved" : "gang_application_rejected",
      entityType: "gang_application",
      entityId: application.id,
      actorUserId: userId,
      actorDiscordId: discordId,
      targetDiscordId: application.user.discordId,
      ipAddress,
      metadata: {
        status,
        adminNotes: application.adminNotes,
        applicantUsername: application.user.username,
        discordRoleGranted,
        discordRoleId,
      },
    });

    return NextResponse.json(application);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to update application" }, { status: 500 });
  }
}
