"use client"

import { Button } from "@/components/ui/button"
import { openCookiePreferences } from "@/lib/marketing"

export function ManageCookiesButton({
  variant = "ghost",
  className,
}: {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
  className?: string
}) {
  return (
    <Button
      type="button"
      variant={variant}
      className={className}
      onClick={() => {
        openCookiePreferences()
      }}
    >
      Gérer mes cookies
    </Button>
  )
}
