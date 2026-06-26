import { NextResponse } from "next/server";
import { auth, resolveSessionUserId, unauthorizedOrDatabaseError } from "@/auth";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";
import { getFormQuestions, validateAnswers } from "@/lib/form-questions";
import { getClientIp } from "@/lib/request";
import { ensureSubmissionAllowed } from "@/lib/submission-guards";

function canManageGangApps(adminType: string | null | undefined): boolean {
  return adminType === "jobs" || adminType === "full";
}

export async function GET() {
  const session = await auth();
  const result = await resolveSessionUserId(session);
  if (!result.ok) return unauthorizedOrDatabaseError(result);
  const userId = result.userId;
  try {
    const adminType = (session!.user as { adminType?: string | null }).adminType;
    if (canManageGangApps(adminType)) {
      const applications = await prisma.gangApplication.findMany({
        include: {
          user: true,
          reviewedByUser: { select: { username: true, avatar: true } },
        },
        orderBy: { createdAt: "desc" },
      });
      return NextResponse.json(applications);
    }
    const applications = await prisma.gangApplication.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(applications);
  } catch (e) {
    console.error("[gang-applications] Error:", e);
    return NextResponse.json([], { status: 200 });
  }
}

export async function POST(request: Request) {
  const session = await auth();
  const result = await resolveSessionUserId(session);
  if (!result.ok) return unauthorizedOrDatabaseError(result);
  const userId = result.userId;
  const discordId = (session?.user as { discordId?: string } | undefined)?.discordId ?? null;
  const ipAddress = getClientIp(request);
  try {
    const body = await request.json();
    const { answers } = body;
    if (!answers || typeof answers !== "object") {
      return NextResponse.json({ error: "Missing or invalid answers" }, { status: 400 });
    }
    const questionDefinitions = await getFormQuestions("gang");
    const validation = validateAnswers(questionDefinitions, answers as Record<string, unknown>);
    if (!validation.ok) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }
    const guard = await ensureSubmissionAllowed({
      kind: "gang",
      userId,
      discordId,
      ipAddress,
    });
    if (!guard.ok) {
      const response = NextResponse.json({ error: guard.error }, { status: guard.status });
      if (guard.retryAfterSeconds) {
        response.headers.set("Retry-After", String(guard.retryAfterSeconds));
      }
      return response;
    }
    const application = await prisma.gangApplication.create({
      data: {
        userId,
        answers: JSON.stringify(validation.normalized),
        submitterIp: ipAddress,
        submitterDiscordId: discordId,
      },
      include: { user: true },
    });
    await createAuditLog({
      action: "gang_application_submitted",
      entityType: "gang_application",
      entityId: application.id,
      actorUserId: userId,
      actorDiscordId: discordId,
      targetDiscordId: application.user.discordId,
      ipAddress,
      metadata: {
        status: application.status,
      },
    });
    return NextResponse.json(application);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to submit application" }, { status: 500 });
  }
}
