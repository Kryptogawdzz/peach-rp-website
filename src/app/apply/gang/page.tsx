"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ApplicationQuestionsForm } from "@/components/application-questions-form";

export default function ApplyGangPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);
  useEffect(() => {
    if (mounted && status === "unauthenticated") {
      router.replace("/api/auth/signin/discord?callbackUrl=/apply/gang");
    }
  }, [mounted, status, router]);

  if (status === "loading" || !mounted) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-zinc-500">Loading...</p>
      </div>
    );
  }

  if (!session) return null;

  return (
    <ApplicationQuestionsForm
      title="Gang application"
      description="Apply to register your gang or set on Peach RP. Leadership will review your submission."
      formType="gang"
      submitUrl="/api/gang-applications"
      submitLabel="Submit gang application"
      successMessage="Gang application submitted. We'll review it soon."
      successRedirect="/applications?tab=gang"
    />
  );
}
