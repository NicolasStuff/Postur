"use client"

import { useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"

import { pushMarketingEvent } from "@/lib/marketing"

export default function CheckoutSuccessPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const plan = searchParams.get("plan")

  useEffect(() => {
    if (!plan) {
      return
    }

    pushMarketingEvent("trial_started", { plan })
    pushMarketingEvent("subscription_purchased", { plan })

    const timeout = window.setTimeout(() => {
      router.replace("/dashboard?checkout=success")
    }, 1800)

    return () => {
      window.clearTimeout(timeout)
    }
  }, [plan, router])

  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(99,102,241,0.08),_transparent_36%),linear-gradient(180deg,_#f8fafc_0%,_#ffffff_100%)] px-6">
      <div className="w-full max-w-xl rounded-[32px] border border-slate-200 bg-white p-10 text-center shadow-[0_40px_100px_-50px_rgba(15,23,42,0.45)]">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
          Checkout validé
        </p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight text-slate-950">
          Essai activé
        </h1>
        <p className="mt-4 text-base leading-7 text-slate-600">
          Votre abonnement a bien été démarré. Nous vous redirigeons vers le dashboard pour
          finaliser la prise en main.
        </p>
      </div>
    </div>
  )
}
