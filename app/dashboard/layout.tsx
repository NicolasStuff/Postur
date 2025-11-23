import { AppSidebar } from "@/components/app-sidebar"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { headers } from "next/headers"
import { redirect } from "next/navigation"

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

  // Fetch user from database to check if onboarding is complete
  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      practitionerType: true,
      name: true,
      email: true,
      image: true,
    },
  })

  // Check if user has completed onboarding
  if (!dbUser?.practitionerType) {
    redirect("/onboarding")
  }

  // Prepare user data for sidebar
  const userData = {
    name: dbUser.name || session.user.name || "Utilisateur",
    email: dbUser.email || session.user.email || "",
    avatar: dbUser.image || session.user.image || "https://github.com/shadcn.png",
  }

  return (
    <SidebarProvider>
      <AppSidebar user={userData} />
      <SidebarInset>
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