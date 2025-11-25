"use client"

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

const faqItems = [
  {
    id: "securite-donnees",
    question: "Est-ce que mes données patients sont en sécurité ?",
    answer:
      "Oui, Postur utilise un hébergement certifié HDS (Hébergeur de Données de Santé) chiffré et conforme aux standards de santé français et européens. Vos données patient vous appartiennent et sont sauvegardées quotidiennement sur des serveurs situés en France. Notre infrastructure est conforme RGPD et répond aux exigences légales pour les professions de santé.",
  },
  {
    id: "import-patients",
    question: "Je suis chez Doctolib ou un autre logiciel, puis-je importer mes patients ?",
    answer:
      "Oui, Postur propose un outil d'import Excel/CSV simple pour récupérer votre base patientèle en quelques minutes. Que vous veniez de Doctolib, Osteo2ls, Veasy, ou tout autre logiciel de gestion de cabinet, notre équipe support peut vous assister gratuitement dans cette migration.",
  },
  {
    id: "facture-x-obligation",
    question: "La Facture-X est-elle obligatoire pour les ostéopathes ?",
    answer:
      "La facturation électronique au format Facture-X deviendra progressivement obligatoire pour toutes les entreprises assujetties à la TVA dès 2026 (réception) et 2027 (émission). Les ostéopathes, même en franchise de TVA, devront se conformer à ces nouvelles normes. S'équiper maintenant avec Postur, c'est éviter la panique plus tard et moderniser votre gestion administrative dès aujourd'hui.",
  },
  {
    id: "body-chart-fonctionnement",
    question: "Comment fonctionne le Body Chart interactif ?",
    answer:
      "Le Body Chart de Postur est une représentation visuelle du corps humain en SVG interactif. En consultation, vous cliquez simplement sur les zones anatomiques concernées pour documenter les douleurs et dysfonctions de votre patient. Le système enregistre automatiquement ces informations dans le dossier patient, vous permettant de suivre l'évolution d'une séance à l'autre sans saisie manuelle.",
  },
  {
    id: "reservation-en-ligne",
    question: "La page de réservation en ligne est-elle vraiment incluse ?",
    answer:
      "Oui, votre page de réservation personnalisée est incluse sans surcoût dans l'abonnement Postur à 29€/mois. Elle est compatible avec Google Maps pour le référencement local et peut être liée à votre profil Doctolib existant. Plus besoin de payer 130€/mois pour un simple agenda en ligne.",
  },
]

export function FAQ() {
  return (
    <Accordion type="single" collapsible className="w-full" itemScope itemType="https://schema.org/FAQPage">
      {faqItems.map((item) => (
        <AccordionItem
          key={item.id}
          value={item.id}
          className="border-slate-100"
          itemScope
          itemProp="mainEntity"
          itemType="https://schema.org/Question"
        >
          <AccordionTrigger className="text-slate-900 hover:text-indigo-600 hover:no-underline text-left">
            <span itemProp="name">{item.question}</span>
          </AccordionTrigger>
          <AccordionContent
            className="text-slate-600"
            itemScope
            itemProp="acceptedAnswer"
            itemType="https://schema.org/Answer"
          >
            <span itemProp="text">{item.answer}</span>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  )
}
