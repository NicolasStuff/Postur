import { LegalPageShell } from "@/components/marketing/LegalPageShell"

export default function LegalNoticePage() {
  return (
    <LegalPageShell
      eyebrow="Mentions légales"
      title="Mentions légales"
      description="Cette page doit être complétée avec les informations exactes de l’éditeur, de l’hébergeur et des contacts de conformité avant publication finale."
    >
      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-slate-950">Éditeur</h2>
        <p className="text-sm leading-7 text-slate-600">
          Renseigner ici la dénomination sociale, la forme juridique, l’adresse, le numéro
          d’immatriculation, le contact de publication et l’email de contact.
        </p>
      </section>
      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-slate-950">Hébergement</h2>
        <p className="text-sm leading-7 text-slate-600">
          Renseigner ici le ou les prestataires d’hébergement utilisés pour le site public et,
          le cas échéant, pour la plateforme applicative.
        </p>
      </section>
      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-slate-950">Contact</h2>
        <p className="text-sm leading-7 text-slate-600">
          Ajouter l’adresse de contact pour les demandes générales, la confidentialité et
          l’exercice des droits.
        </p>
      </section>
    </LegalPageShell>
  )
}
