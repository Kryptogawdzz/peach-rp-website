import { NextResponse } from "next/server";
import { getFormQuestions, parseFormType } from "@/lib/form-questions";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const formType = parseFormType(url.searchParams.get("formType"));

  if (!formType) {
    return NextResponse.json(
      { error: "Invalid formType. Use whitelist, staff, gang, or job:<business-id>." },
      { status: 400 }
    );
  }

  const questions = await getFormQuestions(formType);
  return NextResponse.json(questions);
}
