import { Metadata } from 'next'

import { MarketingTrackingProvider } from "@/components/providers/MarketingTrackingProvider"

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://postur.fr'

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),

  // Titres SEO optimisés pour les mots-clés
  title: {
    default: 'Postur - Logiciel de Gestion de Cabinet pour Ostéopathes | Body Chart & préparation Factur-X',
    template: '%s | Postur - Logiciel Ostéopathe',
  },

  // Description optimisée (155-160 caractères max)
  description: 'Postur : le logiciel de gestion de cabinet ostéopathe avec Body Chart interactif, préparation Factur-X et réservation en ligne. Essai gratuit 14 jours.',

  // Mots-clés stratégiques
  keywords: [
    'logiciel ostéopathe',
    'logiciel gestion cabinet ostéopathie',
    'body chart ostéopathe',
    'facture-x ostéopathe',
    'facturation ostéopathe',
    'réservation en ligne ostéopathe',
    'agenda ostéopathe',
    'gestion cabinet santé',
    'logiciel médical',
    'dossier patient ostéopathie',
    'RGPD santé',
    'alternative doctolib ostéopathe',
    'logiciel ostéopathe mac',
    'logiciel ostéopathe windows',
    'gestion patientèle ostéopathe',
  ],

  // Auteur et éditeur
  authors: [{ name: 'Postur', url: baseUrl }],
  creator: 'Postur',
  publisher: 'Postur',

  // Configuration pour les robots
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },

  // Langue et alternatives
  alternates: {
    canonical: baseUrl,
    languages: {
      'fr-FR': baseUrl,
    },
  },

  // Open Graph pour les réseaux sociaux (Facebook, LinkedIn)
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    url: baseUrl,
    siteName: 'Postur',
    title: 'Postur - Logiciel de Gestion de Cabinet pour Ostéopathes',
    description: 'Le logiciel ostéopathe qui combine Body Chart interactif, préparation Factur-X et réservation en ligne. Essai gratuit 14 jours, sans CB.',
    images: [
      {
        url: `${baseUrl}/images/landing-page/new/body-chart-consultation.png`,
        width: 1200,
        height: 630,
        alt: 'Postur - Interface Body Chart pour Ostéopathes',
        type: 'image/png',
      },
      {
        url: `${baseUrl}/images/logo/logo.svg`,
        width: 512,
        height: 512,
        alt: 'Postur Logo',
        type: 'image/svg+xml',
      },
    ],
  },

  // Twitter Card
  twitter: {
    card: 'summary_large_image',
    title: 'Postur - Logiciel de Gestion de Cabinet pour Ostéopathes',
    description: 'Body Chart interactif, préparation Factur-X, réservation en ligne. Le logiciel moderne pour ostéopathes exigeants. Essai gratuit 14 jours.',
    images: [`${baseUrl}/images/landing-page/new/body-chart-consultation.png`],
    creator: '@postur_fr',
  },

  // Vérification pour Google Search Console
  verification: {
    google: 'VOTRE_CODE_GOOGLE_VERIFICATION', // À remplacer après création Search Console
  },

  // Catégorie
  category: 'Software',

  // Classification
  classification: 'Logiciel médical - Gestion de cabinet - Santé',

  // Autres meta importantes
  other: {
    'geo.region': 'FR',
    'geo.placename': 'France',
    'og:locale:alternate': 'en_US',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'default',
    'apple-mobile-web-app-title': 'Postur',
    'mobile-web-app-capable': 'yes',
    'format-detection': 'telephone=no',
    'msapplication-TileColor': '#4F46E5',
    'theme-color': '#4F46E5',
  },
}

export default function LandingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <MarketingTrackingProvider surface="public">{children}</MarketingTrackingProvider>
}
