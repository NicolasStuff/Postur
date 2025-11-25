import { AppSidebar } from "@/components/app-sidebar"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { TrialBanner } from "@/components/subscription/TrialBanner"
import { SubscriptionStatus } from "@prisma/client"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  // Redirect to signin if not authenticated
  if (!session?.user) {
    redirect("/signin")
  }

  // Fetch user from database with subscription
  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      practitionerType: true,
      name: true,
      email: true,
      image: true,
      subscription: {
        select: {
          status: true,
          plan: true,
          trialEndsAt: true,
          currentPeriodEnd: true,
        },
      },
    },
  })

  // Check if user has completed onboarding
  if (!dbUser?.practitionerType) {
    redirect("/onboarding")
  }

  // Check subscription status
  const subscription = dbUser.subscription
  const activeStatuses: SubscriptionStatus[] = ["TRIALING", "ACTIVE", "PAST_DUE"]
  const hasActiveSubscription = subscription && activeStatuses.includes(subscription.status)

  // If no subscription or inactive, redirect to settings for upgrade
  // Allow access to settings page to let user upgrade
  const currentPath = (await headers()).get("x-pathname") || ""
  const isSettingsPage = currentPath.includes("/settings")

  if (!hasActiveSubscription && !isSettingsPage) {
    redirect("/dashboard/settings?tab=billing&upgrade=true")
  }

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
    avatar: dbUser.image || session.user.image || "https://github.com/shadcn.png",
  }

  // Subscription data for sidebar
  const subscriptionData = subscription ? {
    plan: subscription.plan,
    status: subscription.status,
    trialDaysRemaining,
  } : null

  return (
    <SidebarProvider>
      <AppSidebar user={userData} subscription={subscriptionData} />
      <SidebarInset>
        {/* Trial Banner */}
        {subscription && subscription.status !== "ACTIVE" && (
          <TrialBanner
            daysRemaining={trialDaysRemaining}
            status={subscription.status}
          />
        )}
        <header className="flex h-14 shrink-0 items-center gap-2 border-b bg-background px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
        </header>
        <main className="flex flex-1 flex-col gap-4 p-4 md:p-6">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
