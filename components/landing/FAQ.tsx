"use client"

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

const faqItems = [
  {
    id: "securite-donnees",
    question: "Est-ce que mes données patients sont en sécurité ?",
    answer:
      "Postur applique une approche stricte de sécurité et de minimisation des données, avec une infrastructure hébergée en France. La trajectoire HDS et la gouvernance RGPD santé font partie de la feuille de route de conformité en cours de déploiement.",
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
      "La réforme de la facturation électronique se déploie progressivement à partir de 2026 pour la réception et 2027 pour l’émission selon le profil d’entreprise. Postur prépare les fondations structurées nécessaires, mais la chaîne réglementaire complète dépend aussi d’un raccordement PDP et des validations officielles.",
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
