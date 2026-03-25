import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { MarketingTrackingProvider } from "@/components/providers/MarketingTrackingProvider"

export default async function CheckoutLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session?.user) {
    redirect("/signin")
  }

  return <MarketingTrackingProvider surface="acquisition">{children}</MarketingTrackingProvider>
}
