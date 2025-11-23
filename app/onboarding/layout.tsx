import { ReactNode } from "react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function OnboardingLayout({ children }: { children: ReactNode }) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  // Redirect to signin if not authenticated
  if (!session?.user) {
    redirect("/signin");
  }

  // Fetch user from database to check if already completed onboarding
  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { practitionerType: true },
  });

  // Redirect to dashboard if already completed onboarding
  if (dbUser?.practitionerType) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-muted/20 flex items-center justify-center p-6">
      <div className="w-full max-w-5xl">
        {children}
      </div>
    </div>
  );
}
