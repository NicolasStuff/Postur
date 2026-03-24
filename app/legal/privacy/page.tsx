import { LegalPageShell } from "@/components/marketing/LegalPageShell"

export default function PrivacyPage() {
  return (
    <LegalPageShell
      eyebrow="Confidentialité"
      title="Politique de confidentialité"
      description="Cette page décrit le cadre de traitement des données pour le site Postur et la plateforme SaaS. Elle doit être relue et finalisée avant mise en production commerciale."
    >
      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-slate-950">1. Responsable du traitement</h2>
        <p className="text-sm leading-7 text-slate-600">
          Postur agit comme responsable de traitement pour les données liées au site public,
          à l’acquisition commerciale et à la gestion du compte praticien. Pour les données
          métier traitées dans la plateforme, le rôle exact doit être confirmé dans la
          documentation contractuelle finale.
        </p>
      </section>
      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-slate-950">2. Données traitées</h2>
        <p className="text-sm leading-7 text-slate-600">
          Les données peuvent inclure les informations de compte praticien, les informations
          de facturation, les données de navigation consenties sur le site public et, dans la
          plateforme, des données liées à l’activité de cabinet et aux consultations.
        </p>
      </section>
      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-slate-950">3. Finalités</h2>
        <p className="text-sm leading-7 text-slate-600">
          Les finalités actuelles couvrent l’accès au service, la gestion de l’abonnement, la
          mise à disposition des fonctionnalités métier, la sécurité, le support, ainsi que la
          mesure d’audience et l’acquisition marketing après consentement lorsqu’elles sont actives.
        </p>
      </section>
      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-slate-950">4. Sous-traitants et transferts</h2>
        <p className="text-sm leading-7 text-slate-600">
          Cette version doit être complétée avec la liste effective des sous-traitants,
          notamment l’infrastructure, la facturation, les services de mesure d’audience,
          Google Ads et, le cas échéant, les fournisseurs IA autorisés.
        </p>
      </section>
      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-slate-950">5. Droits des personnes</h2>
        <p className="text-sm leading-7 text-slate-600">
          Les personnes concernées disposent de droits d’accès, de rectification, de limitation
          et, selon le cadre applicable, d’effacement ou d’opposition. Les modalités pratiques
          de contact doivent être renseignées avant publication finale.
        </p>
      </section>
    </LegalPageShell>
  )
}
