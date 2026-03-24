import { MarketingTrackingProvider } from "@/components/providers/MarketingTrackingProvider"

export default function CheckoutLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <MarketingTrackingProvider surface="acquisition">{children}</MarketingTrackingProvider>
}
