import { NextResponse } from "next/server";
import { auth, resolveSessionUserId, unauthorizedOrDatabaseError } from "@/auth";
import { createAuditLog } from "@/lib/audit";
import {
  getJobDiscordRoleSettings,
  normalizeJobDiscordRoleIdsInput,
  saveJobDiscordRoleSettings,
  type JobDiscordRoleSlot,
} from "@/lib/job-discord-roles";
import { getClientIp } from "@/lib/request";

function canEditJobDiscordRoles(adminType: string | null | undefined): boolean {
  return adminType === "full";
}

export async function GET() {
  const session = await auth();
  const result = await resolveSessionUserId(session);
  if (!result.ok) return unauthorizedOrDatabaseError(result);

  const adminType = (session?.user as { adminType?: string | null } | undefined)?.adminType;
  if (!canEditJobDiscordRoles(adminType)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const settings = await getJobDiscordRoleSettings();
  return NextResponse.json(settings);
}

export async function PATCH(request: Request) {
  const session = await auth();
  const result = await resolveSessionUserId(session);
  if (!result.ok) return unauthorizedOrDatabaseError(result);

  const adminType = (session?.user as { adminType?: string | null } | undefined)?.adminType;
  if (!canEditJobDiscordRoles(adminType)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await request.json().catch(() => null)) as
    | { roles?: Partial<Record<JobDiscordRoleSlot, string | null>> }
    | null;

  if (!body?.roles || typeof body.roles !== "object") {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  try {
    normalizeJobDiscordRoleIdsInput(body.roles);
    const settings = await saveJobDiscordRoleSettings(body.roles);

    await createAuditLog({
      action: "job_discord_roles_updated",
      entityType: "site_settings",
      entityId: "job_discord_roles",
      actorUserId: result.userId,
      actorDiscordId: (session?.user as { discordId?: string } | undefined)?.discordId ?? null,
      ipAddress: getClientIp(request),
      metadata: {
        configuredSlots: Object.entries(settings.roles)
          .filter(([, value]) => value.roleId)
          .map(([slot, value]) => ({ slot, source: value.source })),
      },
    });

    return NextResponse.json(settings);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to save job Discord roles";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
