"use client"

import { useTranslations } from "next-intl"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

const statusConfig = {
  DRAFT: {
    key: "statuses.draft" as const,
    className: "",
  },
  SENT: {
    key: "statuses.sent" as const,
    className: "border-amber-200 bg-amber-50 text-amber-700",
  },
  PAID: {
    key: "statuses.paid" as const,
    className: "border-emerald-200 bg-emerald-50 text-emerald-700",
  },
} as const

export function InvoiceStatusBadge({ status }: { status: string }) {
  const t = useTranslations("dashboard.billing")
  const config = statusConfig[status as keyof typeof statusConfig]

  if (!config) {
    return <Badge variant="secondary">{status}</Badge>
  }

  return (
    <Badge
      variant={status === "DRAFT" ? "secondary" : "outline"}
      className={cn(config.className)}
    >
      {t(config.key)}
    </Badge>
  )
}
