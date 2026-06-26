import { prisma } from "@/lib/prisma";
import { appConfig } from "@/config/app.config";

export type CoreFormType = "whitelist" | "staff" | "gang";
export type FormType = CoreFormType | `job:${string}`;

export type FormQuestionType = "text" | "textarea" | "number" | "select";
export type FormQuestionLayout = "full" | "half";

export type FormQuestionDefinition = {
  id: string;
  formType: string;
  questionKey: string;
  label: string;
  type: FormQuestionType;
  required: boolean;
  placeholder: string | null;
  options: string[];
  layout: FormQuestionLayout;
  sortOrder: number;
  isActive: boolean;
};

export type FormTypeOption = {
  id: FormType;
  label: string;
};

export const WHITELIST_RESERVED_QUESTION_KEYS = [
  "inGameName",
  "age",
  "timezone",
  "experience",
  "motivation",
  "characterStory",
  "additionalInfo",
] as const;

export const WHITELIST_REQUIRED_QUESTION_KEYS = [
  "inGameName",
  "age",
  "timezone",
  "experience",
  "motivation",
] as const;

type ConfigQuestion = {
  id: string;
  label: string;
  type: FormQuestionType;
  required: boolean;
  placeholder?: string;
  options?: readonly string[];
};

function parseOptions(value: string | null | undefined): string[] {
  if (!value) return [];

  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed)
      ? parsed.filter((entry): entry is string => typeof entry === "string" && entry.trim().length > 0)
      : [];
  } catch {
    return [];
  }
}

export function isJobFormType(formType: string): formType is `job:${string}` {
  return formType.startsWith("job:") && formType.length > 4;
}

export function jobFormType(businessId: string): FormType {
  return `job:${businessId}`;
}

export function getBusinessIdFromJobFormType(formType: string): string | null {
  if (!isJobFormType(formType)) return null;
  return formType.slice(4);
}

export function getJobFormTypeForJobTitle(jobTitle: string): FormType | null {
  const business = appConfig.businesses.find((entry) => entry.name === jobTitle);
  return business ? jobFormType(business.id) : null;
}

export function parseFormType(value: string | null | undefined): FormType | null {
  if (!value) return null;
  if (value === "whitelist" || value === "staff" || value === "gang") return value;
  if (isJobFormType(value)) {
    const businessId = getBusinessIdFromJobFormType(value);
    if (businessId && appConfig.businesses.some((entry) => entry.id === businessId)) {
      return value;
    }
  }
  return null;
}

export function canManageFormType(
  adminType: string | null | undefined,
  formType: FormType | string
): boolean {
  if (adminType === "full") return true;
  if (formType === "whitelist" || formType === "staff" || formType === "gang") {
    return adminType === "team";
  }
  if (isJobFormType(formType)) {
    return adminType === "jobs";
  }
  return false;
}

export function listAdminFormTypeOptions(): FormTypeOption[] {
  return [
    { id: "whitelist", label: "Whitelist form" },
    { id: "staff", label: "Staff form" },
    { id: "gang", label: "Gang application" },
    ...appConfig.businesses.map((business) => ({
      id: jobFormType(business.id),
      label: `${business.name} (job)`,
    })),
  ];
}

export function getManageableFormTypeOptions(
  adminType: string | null | undefined
): FormTypeOption[] {
  return listAdminFormTypeOptions().filter((option) => canManageFormType(adminType, option.id));
}

function toDbQuestion(
  formType: string,
  question: ConfigQuestion,
  index: number
): Omit<FormQuestionDefinition, "id"> {
  const layout: FormQuestionLayout =
    formType === "whitelist" && (question.id === "age" || question.id === "timezone")
      ? "half"
      : "full";

  return {
    formType,
    questionKey: question.id,
    label: question.label,
    type: question.type,
    required: question.required,
    placeholder: question.placeholder ?? null,
    options: [...(question.options ?? [])],
    layout,
    sortOrder: index,
    isActive: true,
  };
}

function getDefaultQuestionsForFormType(formType: FormType): Omit<FormQuestionDefinition, "id">[] {
  if (formType === "whitelist") {
    return appConfig.whitelistApplicationQuestions.map((question, index) =>
      toDbQuestion("whitelist", question, index)
    );
  }
  if (formType === "staff") {
    return appConfig.staffApplicationQuestions.map((question, index) =>
      toDbQuestion("staff", question, index)
    );
  }
  if (formType === "gang") {
    return appConfig.gangApplicationQuestions.map((question, index) =>
      toDbQuestion("gang", question, index)
    );
  }
  const businessId = getBusinessIdFromJobFormType(formType);
  if (!businessId) return [];
  const jobQuestionsConfig = appConfig.jobApplicationQuestions as Record<
    string,
    readonly ConfigQuestion[]
  >;
  const questions = jobQuestionsConfig[businessId] ?? jobQuestionsConfig.default ?? [];
  return questions.map((question, index) => toDbQuestion(formType, question, index));
}

function mapRecordToDefinition(record: {
  id: string;
  formType: string;
  questionKey: string;
  label: string;
  type: string;
  required: boolean;
  placeholder: string | null;
  options: string | null;
  layout: string;
  sortOrder: number;
  isActive: boolean;
}): FormQuestionDefinition {
  return {
    id: record.id,
    formType: record.formType,
    questionKey: record.questionKey,
    label: record.label,
    type: record.type as FormQuestionType,
    required: record.required,
    placeholder: record.placeholder,
    options: parseOptions(record.options),
    layout: record.layout as FormQuestionLayout,
    sortOrder: record.sortOrder,
    isActive: record.isActive,
  };
}

export function normalizeQuestionKey(value: string): string {
  return value
    .trim()
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .toLowerCase();
}

export async function ensureDefaultFormQuestions(formType: FormType): Promise<void> {
  const defaults = getDefaultQuestionsForFormType(formType);
  if (defaults.length === 0) return;

  const existingCount = await prisma.formQuestion.count({ where: { formType } });
  if (existingCount > 0) return;

  await prisma.formQuestion.createMany({
    data: defaults.map((question) => ({
      formType: question.formType,
      questionKey: question.questionKey,
      label: question.label,
      type: question.type,
      required: question.required,
      placeholder: question.placeholder,
      options: question.options.length ? JSON.stringify(question.options) : null,
      layout: question.layout,
      sortOrder: question.sortOrder,
      isActive: question.isActive,
    })),
  });
}

export async function getFormQuestions(
  formType: FormType,
  options?: { includeInactive?: boolean }
): Promise<FormQuestionDefinition[]> {
  const defaults = getDefaultQuestionsForFormType(formType);

  try {
    await ensureDefaultFormQuestions(formType);

    const records = await prisma.formQuestion.findMany({
      where: {
        formType,
        ...(options?.includeInactive ? {} : { isActive: true }),
      },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    });

    return records.map(mapRecordToDefinition);
  } catch (error) {
    console.error(`Falling back to config questions for ${formType}:`, error);
    return defaults.map((question) => ({
      id: `${formType}-${question.questionKey}`,
      ...question,
    }));
  }
}

export function serializeQuestionOptions(options: string[]): string | null {
  const normalized = options.map((option) => option.trim()).filter(Boolean);
  return normalized.length ? JSON.stringify(normalized) : null;
}

export function validateAnswers(
  questions: FormQuestionDefinition[],
  answers: Record<string, unknown>
): { ok: true; normalized: Record<string, string> } | { ok: false; error: string } {
  const normalized: Record<string, string> = {};

  for (const question of questions) {
    const rawValue = answers[question.questionKey];
    const value =
      typeof rawValue === "string"
        ? rawValue.trim()
        : typeof rawValue === "number"
          ? String(rawValue)
          : "";

    if (question.required && !value) {
      return { ok: false, error: `Missing required field: ${question.label}` };
    }

    if (question.type === "select" && value && question.options.length && !question.options.includes(value)) {
      return { ok: false, error: `Invalid option selected for ${question.label}` };
    }

    normalized[question.questionKey] = value;
  }

  return { ok: true, normalized };
}
