import { NextResponse } from "next/server";
import { auth, resolveSessionUserId, unauthorizedOrDatabaseError } from "@/auth";
import { prisma } from "@/lib/prisma";
import { sendDecisionDM } from "@/lib/discord-dm";
import { grantJobDiscordRoleForJobTitle } from "@/lib/job-discord-roles";
import { createAuditLog } from "@/lib/audit";
import { getClientIp } from "@/lib/request";

function canManageJobApps(adminType: string | null | undefined): boolean {
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
  if (!canManageJobApps(adminType)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await params;
  try {
    const body = await request.json();
    const { status, adminNotes } = body;
    if (!status || !["approved", "rejected"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }
    const application = await prisma.jobApplication.update({
      where: { id },
      data: {
        status,
        adminNotes: adminNotes ? String(adminNotes).trim() : null,
        reviewedBy: userId,
        reviewedAt: new Date(),
      },
      include: {
        job: true,
        user: true,
        reviewedByUser: { select: { username: true, avatar: true } },
      },
    });
    await sendDecisionDM(
      {
        type: "job",
        user: application.user,
        adminNotes: application.adminNotes,
        reviewedAt: application.reviewedAt ?? null,
        jobTitle: application.job.title,
      },
      status
    ).catch((e) => console.error("[discord-dm] Job application DM failed:", e));

    let discordRoleGranted: boolean | null = null;
    let discordRoleId: string | null = null;
    if (status === "approved" && application.user?.discordId) {
      const roleResult = await grantJobDiscordRoleForJobTitle(
        application.user.discordId,
        application.job.title
      ).catch((e) => {
        console.error("[job-discord-roles] Job role grant failed:", e);
        return { granted: false, slot: null, roleId: null };
      });
      discordRoleGranted = roleResult.granted;
      discordRoleId = roleResult.roleId;
      if (!roleResult.granted && roleResult.roleId) {
        console.warn(
          `[job-discord-roles] Role was not assigned for ${application.job.title}. Check bot permissions and that the user is in the server.`
        );
      }
    }

    await createAuditLog({
      action: status === "approved" ? "job_application_approved" : "job_application_rejected",
      entityType: "job_application",
      entityId: application.id,
      actorUserId: userId,
      actorDiscordId: discordId,
      targetDiscordId: application.user.discordId,
      ipAddress,
      metadata: {
        status,
        adminNotes: application.adminNotes,
        jobTitle: application.job.title,
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
