"use client";

import { useEffect, useState } from "react";
import { useToast } from "@/components/toast";
import type { FormQuestionDefinition } from "@/lib/form-questions";

type Props = {
  title: string;
  description: string;
  formType: string;
  submitUrl: string;
  submitLabel: string;
  successRedirect: string;
  successMessage: string;
};

export function ApplicationQuestionsForm({
  title,
  description,
  formType,
  submitUrl,
  submitLabel,
  successRedirect,
  successMessage,
}: Props) {
  const toast = useToast();
  const [questions, setQuestions] = useState<FormQuestionDefinition[]>([]);
  const [questionsLoading, setQuestionsLoading] = useState(true);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/form-questions?formType=${encodeURIComponent(formType)}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load questions");
        return res.json();
      })
      .then((data) => {
        const nextQuestions = Array.isArray(data) ? (data as FormQuestionDefinition[]) : [];
        setQuestions(nextQuestions);
        setAnswers((current) => {
          const next = { ...current };
          for (const question of nextQuestions) {
            next[question.questionKey] = current[question.questionKey] ?? "";
          }
          return next;
        });
      })
      .catch(() => setError("Failed to load application questions."))
      .finally(() => setQuestionsLoading(false));
  }, [formType]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(submitUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to submit");
      }
      toast.addToast(successMessage, "success");
      setTimeout(() => {
        window.location.href = successRedirect;
      }, 1000);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      setError(msg);
      toast.addToast(msg, "error");
    } finally {
      setLoading(false);
    }
  }

  if (questionsLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-zinc-500">Loading questions...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-2 text-2xl font-bold text-zinc-100">{title}</h1>
      <p className="mb-8 text-zinc-400">{description}</p>
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-400">
            {error}
          </p>
        )}
        {questions.length === 0 ? (
          <p className="text-sm text-zinc-400">No questions configured for this application yet.</p>
        ) : (
          questions.map((question) => (
            <div key={question.id}>
              <label htmlFor={question.questionKey} className="mb-1 block text-sm font-medium text-zinc-300">
                {question.label}
                {question.required && <span className="text-amber-500"> *</span>}
              </label>
              {question.type === "textarea" ? (
                <textarea
                  id={question.questionKey}
                  name={question.questionKey}
                  required={question.required}
                  rows={4}
                  value={answers[question.questionKey] ?? ""}
                  onChange={(event) =>
                    setAnswers((current) => ({ ...current, [question.questionKey]: event.target.value }))
                  }
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-4 py-3 text-base text-zinc-100 placeholder-zinc-500 focus:border-[var(--accent)] focus:outline-none"
                  placeholder={question.placeholder ?? "Your answer..."}
                />
              ) : question.type === "select" ? (
                <select
                  id={question.questionKey}
                  name={question.questionKey}
                  required={question.required}
                  value={answers[question.questionKey] ?? ""}
                  onChange={(event) =>
                    setAnswers((current) => ({ ...current, [question.questionKey]: event.target.value }))
                  }
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-4 py-3 text-base text-zinc-100 focus:border-[var(--accent)] focus:outline-none"
                >
                  <option value="">{question.placeholder ?? "Select..."}</option>
                  {question.options.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type={question.type === "number" ? "number" : "text"}
                  id={question.questionKey}
                  name={question.questionKey}
                  required={question.required}
                  value={answers[question.questionKey] ?? ""}
                  onChange={(event) =>
                    setAnswers((current) => ({ ...current, [question.questionKey]: event.target.value }))
                  }
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-4 py-3 text-base text-zinc-100 placeholder-zinc-500 focus:border-[var(--accent)] focus:outline-none"
                  placeholder={question.placeholder ?? "Your answer..."}
                />
              )}
            </div>
          ))
        )}
        <button
          type="submit"
          disabled={loading || questions.length === 0}
          className="brand-bg w-full rounded-lg px-4 py-3 font-semibold transition brand-bg-hover disabled:opacity-50"
        >
          {loading ? "Submitting..." : submitLabel}
        </button>
      </form>
    </div>
  );
}
