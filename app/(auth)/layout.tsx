import { ReactNode } from "react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function AuthLayout({ children }: { children: ReactNode }) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  // If user is already authenticated, redirect based on profile completion
  if (session?.user) {
    // Fetch user from database to check if onboarding is complete
    const dbUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { practitionerType: true },
    });

    // Redirect to onboarding if profile not completed, otherwise to dashboard
    if (dbUser?.practitionerType) {
      redirect("/dashboard");
    } else {
      redirect("/onboarding");
    }
  }

  return <>{children}</>;
}
