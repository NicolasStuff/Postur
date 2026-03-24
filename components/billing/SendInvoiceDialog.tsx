"use client"

import { useState } from "react"
import { Mail } from "lucide-react"
import { useTranslations } from "next-intl"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface SendInvoiceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  invoiceNumber: string
  patientEmail: string | null
  mode: "send" | "resend"
  onConfirm: (options: { sendEmail: boolean; email: string }) => Promise<void>
  isLoading: boolean
}

export function SendInvoiceDialog({
  open,
  onOpenChange,
  invoiceNumber,
  patientEmail,
  mode,
  onConfirm,
  isLoading,
}: SendInvoiceDialogProps) {
  const t = useTranslations("dashboard.billing.sendDialog")
  const [email, setEmail] = useState(patientEmail || "")
  const [sendEmail, setSendEmail] = useState(Boolean(patientEmail))

  const handleOpenChange = (value: boolean) => {
    if (!value) {
      setEmail(patientEmail || "")
      setSendEmail(Boolean(patientEmail))
    }
    onOpenChange(value)
  }

  const isEmailValid = !sendEmail || (email.trim().length > 0 && email.includes("@"))

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {mode === "send" ? t("title") : t("resendTitle")}
          </DialogTitle>
          <DialogDescription>{invoiceNumber}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {mode === "send" && (
            <div className="flex items-start gap-3">
              <Checkbox
                id="sendEmail"
                checked={sendEmail}
                onCheckedChange={(checked) => setSendEmail(checked === true)}
              />
              <div className="space-y-1">
                <Label htmlFor="sendEmail" className="cursor-pointer font-normal">
                  {t("sendByEmail")}
                </Label>
                {!patientEmail && (
                  <p className="text-xs text-muted-foreground">{t("noEmail")}</p>
                )}
              </div>
            </div>
          )}

          {(sendEmail || mode === "resend") && (
            <div className="space-y-2">
              <Label htmlFor="email">{t("emailLabel")}</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t("emailPlaceholder")}
                  className="pl-9"
                />
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            {t("cancel")}
          </Button>
          <Button
            onClick={() => onConfirm({ sendEmail: sendEmail || mode === "resend", email })}
            disabled={isLoading || !isEmailValid}
          >
            {isLoading
              ? t("sending")
              : mode === "send"
                ? t("send")
                : t("resend")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
