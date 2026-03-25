import { MarketingTrackingProvider } from "@/components/providers/MarketingTrackingProvider"

export default function LegalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <MarketingTrackingProvider surface="public">{children}</MarketingTrackingProvider>
}
