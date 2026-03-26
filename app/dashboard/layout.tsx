import { AppSidebar } from "@/components/app-sidebar"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { auth } from "@/lib/auth"
import { isOnboardingComplete } from "@/lib/onboarding"
import { prisma } from "@/lib/prisma"
import { hasCoreAppAccess } from "@/lib/subscription-access"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { BillingSettings } from "@/components/settings/BillingSettings"
import { SupportChatWidget } from "@/components/support/SupportChatWidget"
import { DashboardTour } from "@/components/onboarding/DashboardTour"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const headerStore = await headers()
  const session = await auth.api.getSession({
    headers: headerStore,
  })

  // Redirect to signin if not authenticated
  if (!session?.user) {
    redirect("/signin")
  }

  // Fetch user from database with subscription
  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      role: true,
      practitionerType: true,
      slug: true,
      companyName: true,
      companyAddress: true,
      siret: true,
      name: true,
      email: true,
      image: true,
      completedTours: true,
      subscription: {
        select: {
          status: true,
          plan: true,
          trialEndsAt: true,
          currentPeriodEnd: true,
          cancelAtPeriodEnd: true,
        },
      },
    },
  })

  const pathname = headerStore.get("x-pathname") || ""
  const isAdmin = dbUser?.role === "ADMIN"
  const isAdminRoute = pathname.startsWith("/dashboard/admin")

  // Check if user has completed onboarding
  if (!dbUser || (!isAdmin && !isOnboardingComplete(dbUser))) {
    redirect("/onboarding")
  }

  // Check subscription status
  const subscription = dbUser.subscription
  const hasActiveSubscription = hasCoreAppAccess(subscription)
  const canAccessWithoutSubscription =
    isAdmin ||
    pathname.startsWith("/dashboard/settings") ||
    pathname.startsWith("/dashboard/billing")

  // Calculate trial days remaining
  let trialDaysRemaining = 0
  if (subscription?.status === "TRIALING" && subscription.trialEndsAt) {
    const now = new Date()
    const trialEnd = new Date(subscription.trialEndsAt)
    const diffTime = trialEnd.getTime() - now.getTime()
    trialDaysRemaining = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)))
  }

  // Prepare user data for sidebar
  const userData = {
    name: dbUser.name || session.user.name || "Utilisateur",
    email: dbUser.email || session.user.email || "",
    avatar: dbUser.image || session.user.image || "/images/logo.svg",
  }

  // Subscription data for sidebar
  const subscriptionData = subscription ? {
    plan: subscription.plan,
    status: subscription.status,
    trialDaysRemaining,
  } : null

  return (
    <SidebarProvider>
      <AppSidebar user={userData} subscription={subscriptionData} isAdmin={isAdmin} />
      <SidebarInset>
        <main className="flex flex-1 flex-col gap-4 p-4 md:p-6">
          {hasActiveSubscription || canAccessWithoutSubscription ? (
            children
          ) : (
            <BillingSettings subscription={subscription} showUpgradeModal />
          )}
        </main>
        {!isAdmin && !isAdminRoute ? <SupportChatWidget /> : null}
      </SidebarInset>
      {!isAdmin && hasActiveSubscription && (
        <DashboardTour
          completedTours={Array.isArray(dbUser?.completedTours) ? dbUser.completedTours as string[] : []}
        />
      )}
    </SidebarProvider>
  )
}
