"use client";

import { useEffect, useState, type FormEvent } from "react";
import { appConfig } from "@/config/app.config";
import { useToast } from "@/components/toast";
import {
  JOB_DISCORD_ROLE_DEFINITIONS,
  type JobDiscordRoleSettings,
  type JobDiscordRoleSlot,
} from "@/lib/job-discord-roles";

const inputClass =
  "w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3 font-mono text-base text-zinc-100 placeholder-zinc-500 focus:border-[var(--accent)] focus:outline-none";

function sourceLabel(source: "database" | "env" | "unset"): string {
  if (source === "database") return "Saved in admin";
  if (source === "env") return "From environment";
  return "Not configured";
}

function businessNamesForIds(businessIds: string[]): string {
  return businessIds
    .map((id) => appConfig.businesses.find((business) => business.id === id)?.name ?? id)
    .join(", ");
}

export function AdminJobDiscordRoles() {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<JobDiscordRoleSettings | null>(null);
  const [draft, setDraft] = useState<Record<JobDiscordRoleSlot, string>>({
    pd: "",
    ems: "",
    real_estate: "",
    business_owner: "",
    drug_gun_plug: "",
    gang_member: "",
  });

  useEffect(() => {
    fetch("/api/admin/job-discord-roles")
      .then(async (res) => {
        if (!res.ok) throw new Error("Failed to load Discord role settings");
        return res.json() as Promise<JobDiscordRoleSettings>;
      })
      .then((data) => {
        setSettings(data);
        const nextDraft = JOB_DISCORD_ROLE_DEFINITIONS.reduce(
          (acc, definition) => {
            acc[definition.id] = data.roles[definition.id]?.roleId ?? "";
            return acc;
          },
          {} as Record<JobDiscordRoleSlot, string>
        );
        setDraft(nextDraft);
      })
      .catch((error) => {
        console.error(error);
        toast.addToast("Could not load Discord role settings.", "error");
      })
      .finally(() => setLoading(false));
  }, [toast]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);

    try {
      const res = await fetch("/api/admin/job-discord-roles", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roles: draft }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(typeof data.error === "string" ? data.error : "Failed to save");
      }

      const saved = data as JobDiscordRoleSettings;
      setSettings(saved);
      const nextDraft = JOB_DISCORD_ROLE_DEFINITIONS.reduce(
        (acc, definition) => {
          acc[definition.id] = saved.roles[definition.id]?.roleId ?? "";
          return acc;
        },
        {} as Record<JobDiscordRoleSlot, string>
      );
      setDraft(nextDraft);
      toast.addToast("Discord role mappings saved.", "success");
    } catch (error) {
      toast.addToast(error instanceof Error ? error.message : "Failed to save.", "error");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <p className="text-zinc-500">Loading Discord role settings…</p>;
  }

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
        <h2 className="text-lg font-semibold text-zinc-100">Job Discord roles</h2>
        <p className="mt-1 text-sm text-zinc-500">
          When a job or gang application is <strong className="text-zinc-400">approved</strong>, the bot
          assigns the matching Discord role. Values saved here override environment variables. Leave a field
          blank to fall back to the matching <code className="rounded bg-zinc-800 px-1">.env</code> variable.
        </p>
        <p className="mt-2 text-xs text-amber-500/90">
          Requires <code className="rounded bg-zinc-800 px-1">DISCORD_BOT_TOKEN</code>,{" "}
          <code className="rounded bg-zinc-800 px-1">DISCORD_GUILD_ID</code>, and the bot role above these
          roles in Discord.
        </p>
      </section>

      <form onSubmit={handleSubmit} className="space-y-4">
        {JOB_DISCORD_ROLE_DEFINITIONS.map((definition) => {
          const current = settings?.roles[definition.id];
          const appliesTo =
            definition.id === "gang_member"
              ? "Gang applications"
              : businessNamesForIds(definition.businessIds);

          return (
            <div
              key={definition.id}
              className="space-y-3 rounded-xl border border-zinc-800 bg-zinc-900/60 p-4"
            >
              <div className="space-y-1">
                <label htmlFor={`role-${definition.id}`} className="text-sm font-medium text-zinc-200">
                  {definition.label}
                </label>
                <p className="text-xs text-zinc-500">Applies to: {appliesTo}</p>
                <p className="text-xs text-zinc-600">
                  Env fallback: <code className="rounded bg-zinc-800 px-1">{definition.envVar}</code>
                  {current ? (
                    <>
                      {" "}
                      · Active source:{" "}
                      <span className="text-zinc-400">{sourceLabel(current.source)}</span>
                    </>
                  ) : null}
                </p>
              </div>
              <input
                id={`role-${definition.id}`}
                type="text"
                inputMode="numeric"
                pattern="\d*"
                placeholder={current?.source === "env" ? current.roleId ?? "Role ID" : "Discord role ID"}
                value={draft[definition.id]}
                onChange={(event) =>
                  setDraft((prev) => ({ ...prev, [definition.id]: event.target.value.trim() }))
                }
                className={inputClass}
              />
            </div>
          );
        })}

        <button
          type="submit"
          disabled={saving}
          className="brand-bg rounded-lg px-4 py-3 text-sm font-medium transition brand-bg-hover disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save Discord role mappings"}
        </button>
      </form>
    </div>
  );
}
