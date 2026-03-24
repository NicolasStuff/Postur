import Link from "next/link"

import { MarketingFooter } from "@/components/marketing/MarketingFooter"

export function LegalPageShell({
  title,
  eyebrow,
  description,
  children,
}: {
  title: string
  eyebrow: string
  description: string
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,_#f8fafc_0%,_#ffffff_18%,_#ffffff_100%)] text-slate-900">
      <header className="border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="container mx-auto flex items-center justify-between px-6 py-4">
          <Link href="/" className="text-sm font-semibold uppercase tracking-[0.28em] text-slate-900">
            POSTUR
          </Link>
          <Link href="/" className="text-sm text-slate-500 hover:text-slate-900">
            Retour à l’accueil
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-6 py-16">
        <div className="mx-auto max-w-4xl">
          <div className="mb-10 space-y-4">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
              {eyebrow}
            </p>
            <h1 className="text-4xl font-semibold tracking-tight text-slate-950 md:text-5xl">
              {title}
            </h1>
            <p className="max-w-3xl text-base leading-7 text-slate-600 md:text-lg">
              {description}
            </p>
          </div>

          <div className="space-y-6 rounded-[28px] border border-slate-200 bg-white p-8 shadow-[0_30px_80px_-45px_rgba(15,23,42,0.35)]">
            {children}
          </div>
        </div>
      </main>

      <MarketingFooter />
    </div>
  )
}
