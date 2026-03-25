import { LegalPageShell } from "@/components/marketing/LegalPageShell"

export default function TermsPage() {
  return (
    <LegalPageShell
      eyebrow="Conditions"
      title="Conditions générales d’utilisation"
      description="Cette page pose le cadre d’utilisation du site et du service. Le contenu doit être relu et complété avant ouverture commerciale large."
    >
      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-slate-950">1. Objet</h2>
        <p className="text-sm leading-7 text-slate-600">
          Postur met à disposition une plateforme de gestion de cabinet destinée aux ostéopathes
          et aux praticiens autorisés par l’éditeur.
        </p>
      </section>
      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-slate-950">2. Accès au service</h2>
        <p className="text-sm leading-7 text-slate-600">
          L’accès à certaines fonctionnalités dépend d’un compte actif, d’un abonnement valide
          et du respect des conditions de sécurité et de conformité applicables.
        </p>
      </section>
      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-slate-950">3. Responsabilités</h2>
        <p className="text-sm leading-7 text-slate-600">
          Les fonctionnalités d’assistance, notamment IA, restent des aides à la rédaction ou à
          l’organisation et ne remplacent ni l’analyse clinique ni les obligations légales du praticien.
        </p>
      </section>
      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-slate-950">4. Abonnement et résiliation</h2>
        <p className="text-sm leading-7 text-slate-600">
          Les conditions tarifaires, d’essai, de renouvellement et de résiliation doivent être
          alignées sur la configuration Stripe et la documentation contractuelle finale.
        </p>
      </section>
    </LegalPageShell>
  )
}
