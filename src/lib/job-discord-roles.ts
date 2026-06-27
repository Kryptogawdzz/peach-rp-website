import { appConfig } from "@/config/app.config";
import { prisma } from "@/lib/prisma";
import { addGuildMemberRole } from "@/lib/discord-roles";

export type JobDiscordRoleSlot =
  | "pd"
  | "ems"
  | "real_estate"
  | "business_owner"
  | "drug_gun_plug"
  | "gang_member";

export type JobDiscordRoleDefinition = {
  id: JobDiscordRoleSlot;
  label: string;
  envVar: string;
  /** Config business ids that use this role (empty for gang). */
  businessIds: string[];
};

export const JOB_DISCORD_ROLE_DEFINITIONS: JobDiscordRoleDefinition[] = [
  {
    id: "pd",
    label: "Police (Peach PD)",
    envVar: "DISCORD_PD_ROLE_ID",
    businessIds: ["peach-pd"],
  },
  {
    id: "ems",
    label: "EMS (Peach Medical)",
    envVar: "DISCORD_EMS_ROLE_ID",
    businessIds: ["peach-medical"],
  },
  {
    id: "real_estate",
    label: "Real estate (Peach Realty)",
    envVar: "DISCORD_REAL_ESTATE_ROLE_ID",
    businessIds: ["peach-realty"],
  },
  {
    id: "business_owner",
    label: "Business owner (Peach Mechanics)",
    envVar: "DISCORD_BUSINESS_OWNER_ROLE_ID",
    businessIds: ["peach-mechanics"],
  },
  {
    id: "drug_gun_plug",
    label: "Drug & gun plug",
    envVar: "DISCORD_DRUG_GUN_PLUG_ROLE_ID",
    businessIds: ["gun-plug", "drug-plug"],
  },
  {
    id: "gang_member",
    label: "Gang member",
    envVar: "DISCORD_GANG_MEMBER_ROLE_ID",
    businessIds: [],
  },
];

const SITE_SETTINGS_ID = "default";
const MISSING_COLUMN = "jobDiscordRoleIdsJson";

const BUSINESS_TO_SLOT = JOB_DISCORD_ROLE_DEFINITIONS.reduce(
  (acc, definition) => {
    for (const businessId of definition.businessIds) {
      acc[businessId] = definition.id;
    }
    return acc;
  },
  {} as Record<string, JobDiscordRoleSlot>
);

function readEnvRoleId(envVar: string): string | null {
  const value = process.env[envVar]?.trim();
  return value || null;
}

export function getDefaultJobDiscordRoleIdsFromEnv(): Record<JobDiscordRoleSlot, string | null> {
  return JOB_DISCORD_ROLE_DEFINITIONS.reduce(
    (acc, definition) => {
      acc[definition.id] = readEnvRoleId(definition.envVar);
      return acc;
    },
    {} as Record<JobDiscordRoleSlot, string | null>
  );
}

function parseStoredRoleIds(value: string | null | undefined): Partial<Record<JobDiscordRoleSlot, string>> {
  if (!value) return {};

  try {
    const parsed = JSON.parse(value) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};

    const result: Partial<Record<JobDiscordRoleSlot, string>> = {};
    for (const definition of JOB_DISCORD_ROLE_DEFINITIONS) {
      const raw = (parsed as Record<string, unknown>)[definition.id];
      if (typeof raw === "string" && raw.trim()) {
        result[definition.id] = raw.trim();
      }
    }
    return result;
  } catch {
    return {};
  }
}

function isValidDiscordSnowflake(value: string): boolean {
  return /^\d{17,20}$/.test(value.trim());
}

export function normalizeJobDiscordRoleIdsInput(
  input: Partial<Record<JobDiscordRoleSlot, string | null | undefined>> | null | undefined
): Partial<Record<JobDiscordRoleSlot, string>> {
  if (!input) return {};

  const result: Partial<Record<JobDiscordRoleSlot, string>> = {};
  for (const definition of JOB_DISCORD_ROLE_DEFINITIONS) {
    const raw = input[definition.id];
    if (raw == null) continue;
    const trimmed = String(raw).trim();
    if (!trimmed) continue;
    if (!isValidDiscordSnowflake(trimmed)) {
      throw new Error(`Invalid Discord role ID for ${definition.label}. Use a numeric role ID.`);
    }
    result[definition.id] = trimmed;
  }
  return result;
}

export type JobDiscordRoleSettings = {
  roles: Record<
    JobDiscordRoleSlot,
    {
      roleId: string | null;
      source: "database" | "env" | "unset";
      envVar: string;
      label: string;
      businessIds: string[];
    }
  >;
};

export function mergeJobDiscordRoleSettings(
  dbOverrides: Partial<Record<JobDiscordRoleSlot, string>>
): JobDiscordRoleSettings {
  const envDefaults = getDefaultJobDiscordRoleIdsFromEnv();

  const roles = JOB_DISCORD_ROLE_DEFINITIONS.reduce(
    (acc, definition) => {
      const dbValue = dbOverrides[definition.id]?.trim();
      const envValue = envDefaults[definition.id];
      const roleId = dbValue || envValue || null;
      acc[definition.id] = {
        roleId,
        source: dbValue ? "database" : envValue ? "env" : "unset",
        envVar: definition.envVar,
        label: definition.label,
        businessIds: definition.businessIds,
      };
      return acc;
    },
    {} as JobDiscordRoleSettings["roles"]
  );

  return { roles };
}

async function ensureJobDiscordRoleIdsColumn(): Promise<void> {
  try {
    await prisma.$executeRawUnsafe(
      'ALTER TABLE "SiteSettings" ADD COLUMN IF NOT EXISTS "jobDiscordRoleIdsJson" TEXT'
    );
  } catch {
    // Ignore auto-repair failures and let the original request error surface.
  }
}

function isMissingColumnError(error: unknown): boolean {
  if (error && typeof error === "object" && "code" in error && error.code === "P2022") {
    const column = String((error as { meta?: { column?: string } }).meta?.column ?? "");
    return column.includes(MISSING_COLUMN);
  }
  if (error instanceof Error) {
    return error.message.includes(MISSING_COLUMN);
  }
  return false;
}

async function loadDbOverrides(): Promise<Partial<Record<JobDiscordRoleSlot, string>>> {
  try {
    const record = await prisma.siteSettings.findUnique({
      where: { id: SITE_SETTINGS_ID },
      select: { jobDiscordRoleIdsJson: true },
    });
    return parseStoredRoleIds(record?.jobDiscordRoleIdsJson);
  } catch (error) {
    if (!isMissingColumnError(error)) throw error;
    await ensureJobDiscordRoleIdsColumn();
    const record = await prisma.siteSettings.findUnique({
      where: { id: SITE_SETTINGS_ID },
      select: { jobDiscordRoleIdsJson: true },
    });
    return parseStoredRoleIds(record?.jobDiscordRoleIdsJson);
  }
}

export async function getJobDiscordRoleSettings(): Promise<JobDiscordRoleSettings> {
  const dbOverrides = await loadDbOverrides();
  return mergeJobDiscordRoleSettings(dbOverrides);
}

export async function saveJobDiscordRoleSettings(
  input: Partial<Record<JobDiscordRoleSlot, string | null | undefined>>
): Promise<JobDiscordRoleSettings> {
  const normalized = normalizeJobDiscordRoleIdsInput(input);

  const payload = {
    jobDiscordRoleIdsJson: JSON.stringify(normalized),
  };

  try {
    await prisma.siteSettings.upsert({
      where: { id: SITE_SETTINGS_ID },
      create: {
        id: SITE_SETTINGS_ID,
        ...payload,
      },
      update: payload,
    });
  } catch (error) {
    if (!isMissingColumnError(error)) throw error;
    await ensureJobDiscordRoleIdsColumn();
    await prisma.siteSettings.upsert({
      where: { id: SITE_SETTINGS_ID },
      create: {
        id: SITE_SETTINGS_ID,
        ...payload,
      },
      update: payload,
    });
  }

  return mergeJobDiscordRoleSettings(normalized);
}

export function getJobDiscordRoleSlotForBusinessId(businessId: string): JobDiscordRoleSlot | null {
  return BUSINESS_TO_SLOT[businessId] ?? null;
}

export function getJobDiscordRoleSlotForJobTitle(jobTitle: string): JobDiscordRoleSlot | null {
  const business = appConfig.businesses.find((entry) => entry.name === jobTitle);
  if (!business) return null;
  return getJobDiscordRoleSlotForBusinessId(business.id);
}

export async function resolveJobDiscordRoleId(slot: JobDiscordRoleSlot): Promise<string | null> {
  const settings = await getJobDiscordRoleSettings();
  return settings.roles[slot]?.roleId ?? null;
}

export async function grantJobDiscordRoleForJobTitle(
  discordUserId: string,
  jobTitle: string
): Promise<{ granted: boolean; slot: JobDiscordRoleSlot | null; roleId: string | null }> {
  const slot = getJobDiscordRoleSlotForJobTitle(jobTitle);
  if (!slot) {
    return { granted: false, slot: null, roleId: null };
  }

  const roleId = await resolveJobDiscordRoleId(slot);
  if (!roleId) {
    console.warn(`[job-discord-roles] No role ID configured for slot "${slot}" (${jobTitle}).`);
    return { granted: false, slot, roleId: null };
  }

  const granted = await addGuildMemberRole(discordUserId, roleId);
  return { granted, slot, roleId };
}

export async function grantGangMemberDiscordRole(
  discordUserId: string
): Promise<{ granted: boolean; roleId: string | null }> {
  const roleId = await resolveJobDiscordRoleId("gang_member");
  if (!roleId) {
    console.warn("[job-discord-roles] No gang member role ID configured.");
    return { granted: false, roleId: null };
  }

  const granted = await addGuildMemberRole(discordUserId, roleId);
  return { granted, roleId };
}
