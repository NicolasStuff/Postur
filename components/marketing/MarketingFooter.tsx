import Link from "next/link"

import { ManageCookiesButton } from "@/components/marketing/ManageCookiesButton"

export function MarketingFooter() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="container mx-auto flex flex-col gap-6 px-6 py-10 text-sm text-slate-500 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <p className="font-semibold uppercase tracking-[0.28em] text-slate-900">POSTUR</p>
          <p>Logiciel de gestion de cabinet pour ostéopathes.</p>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-sm">
          <Link href="/legal/privacy" className="rounded-full px-3 py-1 hover:bg-slate-100 hover:text-slate-900">
            Confidentialité
          </Link>
          <Link href="/legal/cookies" className="rounded-full px-3 py-1 hover:bg-slate-100 hover:text-slate-900">
            Cookies
          </Link>
          <Link href="/legal/terms" className="rounded-full px-3 py-1 hover:bg-slate-100 hover:text-slate-900">
            CGU
          </Link>
          <Link
            href="/legal/mentions-legales"
            className="rounded-full px-3 py-1 hover:bg-slate-100 hover:text-slate-900"
          >
            Mentions légales
          </Link>
          <ManageCookiesButton variant="ghost" className="rounded-full px-3 py-1 text-slate-600 hover:bg-slate-100 hover:text-slate-900" />
        </div>
      </div>
    </footer>
  )
}
