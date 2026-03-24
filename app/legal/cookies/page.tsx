import { LegalPageShell } from "@/components/marketing/LegalPageShell"

export default function CookiesPage() {
  return (
    <LegalPageShell
      eyebrow="Cookies"
      title="Politique cookies"
      description="Cette page documente le bandeau CMP, les services marketing et les cookies strictement nécessaires actuellement prévus dans Postur."
    >
      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-slate-950">1. Cookies strictement nécessaires</h2>
        <p className="text-sm leading-7 text-slate-600">
          Postur utilise des cookies techniques indispensables au fonctionnement du site et de
          l’application, dont la préférence de langue et certains états d’interface. Ces cookies
          ne servent pas à la publicité.
        </p>
      </section>
      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-slate-950">2. CMP et gestion du consentement</h2>
        <p className="text-sm leading-7 text-slate-600">
          Le recueil du consentement est assuré par Axeptio. Les services marketing ne doivent être
          chargés qu’après accord explicite de l’utilisateur. Le retrait du consentement reste
          accessible à tout moment depuis le lien “Gérer mes cookies”.
        </p>
      </section>
      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-slate-950">3. Services soumis au consentement</h2>
        <ul className="list-disc space-y-2 pl-5 text-sm leading-7 text-slate-600">
          <li>Google Tag Manager</li>
          <li>Google Analytics 4</li>
          <li>Google Ads</li>
        </ul>
      </section>
      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-slate-950">4. Paramétrage prévu</h2>
        <p className="text-sm leading-7 text-slate-600">
          Postur prévoit un mode “basic consent” pour Google Consent Mode v2, avec refus par défaut
          et activation conditionnée à l’acceptation des finalités concernées.
        </p>
      </section>
    </LegalPageShell>
  )
}
