import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { appConfig } from "@/config/app.config";
import { ApplicationQuestionsForm } from "@/components/application-questions-form";
import { prisma } from "@/lib/prisma";
import { jobFormType } from "@/lib/form-questions";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function JobApplyPage({ params }: Props) {
  const session = await auth();
  const { id } = await params;

  if (!session) {
    redirect(`/api/auth/signin/discord?callbackUrl=${encodeURIComponent(`/jobs/${id}/apply`)}`);
  }

  const job = await prisma.job.findUnique({ where: { id } });
  if (!job) notFound();

  const business = appConfig.businesses.find((entry) => entry.name === job.title);
  if (!business) notFound();

  return (
    <ApplicationQuestionsForm
      title={`Apply: ${job.title}`}
      description={`Complete the application for ${job.title}. ${job.description}`}
      formType={jobFormType(business.id)}
      submitUrl={`/api/jobs/${job.id}/apply`}
      submitLabel={`Submit ${job.title} application`}
      successMessage="Job application submitted. We'll review it soon."
      successRedirect="/applications?tab=jobs"
    />
  );
}
