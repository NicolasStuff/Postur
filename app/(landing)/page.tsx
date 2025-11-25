import Link from "next/link"
import Image from "next/image"
import { ArrowRight, Check, Shield, Calendar, FileText, User, Lock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MobileMenu } from "@/components/landing/MobileMenu"
import { FAQ } from "@/components/landing/FAQ"
import { AnimatedDiv, AnimatedSection } from "@/components/landing/AnimatedSection"
import { HeroSection } from "@/components/landing/HeroSection"

// JSON-LD Structured Data
const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": "https://postur.fr/#website",
      url: "https://postur.fr",
      name: "Postur",
      description: "Logiciel de gestion de cabinet pour ostéopathes",
      publisher: { "@id": "https://postur.fr/#organization" },
      inLanguage: "fr-FR",
    },
    {
      "@type": "Organization",
      "@id": "https://postur.fr/#organization",
      name: "Postur",
      url: "https://postur.fr",
      logo: {
        "@type": "ImageObject",
        url: "https://postur.fr/images/logo/logo.svg",
        width: 512,
        height: 512,
      },
      description: "Éditeur de logiciel de gestion de cabinet pour ostéopathes et praticiens de santé",
      address: {
        "@type": "PostalAddress",
        addressCountry: "FR",
      },
      sameAs: [],
    },
    {
      "@type": "SoftwareApplication",
      "@id": "https://postur.fr/#software",
      name: "Postur - Logiciel Ostéopathe",
      applicationCategory: "BusinessApplication",
      applicationSubCategory: "Logiciel médical",
      operatingSystem: "Web, macOS, Windows",
      description: "Logiciel de gestion de cabinet pour ostéopathes avec Body Chart interactif, facturation Facture-X et réservation en ligne",
      offers: [
        {
          "@type": "Offer",
          name: "Pro",
          price: "29",
          priceCurrency: "EUR",
          priceValidUntil: "2025-12-31",
          availability: "https://schema.org/InStock",
          url: "https://postur.fr/#pricing",
        },
        {
          "@type": "Offer",
          name: "Pro + IA",
          price: "39",
          priceCurrency: "EUR",
          priceValidUntil: "2025-12-31",
          availability: "https://schema.org/InStock",
          url: "https://postur.fr/#pricing",
        },
      ],
      featureList: [
        "Body Chart interactif SVG",
        "Facturation Facture-X 2026",
        "Réservation en ligne intégrée",
        "Rappels SMS et email automatiques",
        "Gestion des dossiers patients",
        "Export comptable automatique",
        "Conforme RGPD et HDS",
      ],
      screenshot: "https://postur.fr/images/landing-page/new/body-chart-consultation.png",
      softwareVersion: "1.0",
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: "4.9",
        ratingCount: "50",
        bestRating: "5",
        worstRating: "1",
      },
    },
    {
      "@type": "WebPage",
      "@id": "https://postur.fr/#webpage",
      url: "https://postur.fr",
      name: "Postur - Logiciel de Gestion de Cabinet pour Ostéopathes | Body Chart & Facture-X",
      description: "Le premier logiciel ostéopathe qui combine Body Chart interactif, Facture-X native et Réservation en ligne. Essai gratuit 14 jours.",
      isPartOf: { "@id": "https://postur.fr/#website" },
      about: { "@id": "https://postur.fr/#software" },
      inLanguage: "fr-FR",
      primaryImageOfPage: {
        "@type": "ImageObject",
        url: "https://postur.fr/images/landing-page/new/body-chart-consultation.png",
      },
    },
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Accueil",
          item: "https://postur.fr",
        },
      ],
    },
  ],
}

export default function LandingPage() {
  return (
    <>
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="min-h-screen bg-white font-sans text-slate-900 selection:bg-indigo-100 selection:text-indigo-900 overflow-x-hidden">
        {/* Header / Navigation */}
        <header>
          <nav
            className="sticky top-0 z-50 w-full border-b border-slate-100 bg-white/80 backdrop-blur-md"
            role="navigation"
            aria-label="Navigation principale"
          >
            <div className="container mx-auto px-6 h-16 flex items-center justify-between">
              <Link
                href="/"
                className="flex items-center gap-2 group"
                aria-label="Postur - Retour à l'accueil"
              >
                <Image
                  src="/images/logo/logo.svg"
                  alt="Postur - Logo du logiciel de gestion pour ostéopathes"
                  width={40}
                  height={40}
                  className="h-10 w-auto transition-transform group-hover:scale-105"
                  priority
                />
                <span className="text-xl font-bold tracking-tighter text-slate-900">POSTUR</span>
              </Link>

              {/* Desktop Navigation */}
              <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
                <Link href="#features" className="hover:text-indigo-600 transition-colors">
                  Fonctionnalités
                </Link>
                <Link href="#facture-x" className="hover:text-indigo-600 transition-colors">
                  Facture-X
                </Link>
                <Link href="#pricing" className="hover:text-indigo-600 transition-colors">
                  Tarifs
                </Link>
              </div>

              {/* CTA Desktop */}
              <div className="hidden md:flex items-center gap-4">
                <Link href="/signin?tab=signin">
                  <Button variant="ghost" className="text-slate-600 hover:text-slate-900 hover:bg-slate-50">
                    Connexion
                  </Button>
                </Link>
                <Link href="/signin">
                  <Button className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full px-6 font-medium shadow-lg shadow-indigo-200 hover:shadow-indigo-300 transition-all">
                    Essai Gratuit
                  </Button>
                </Link>
              </div>

              {/* Mobile Menu */}
              <MobileMenu />
            </div>
          </nav>
        </header>

        <main id="main-content" role="main">
          {/* Hero Section with scroll takeover effect */}
          <HeroSection />

          {/* Social Proof / Trust Signals */}
          <section className="py-10 border-b border-slate-100 bg-white" aria-label="Confiance et conformité">
            <div className="container mx-auto px-6">
              <p className="text-center text-sm font-semibold text-slate-400 mb-8">
                Conçu avec les retours de 50+ ostéopathes indépendants en France
              </p>
              <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 opacity-60 grayscale transition-all hover:grayscale-0 duration-500">
                <div className="flex items-center gap-2 font-bold text-lg text-slate-600">
                  <div className="h-5 w-5 bg-slate-400 rounded-full" />
                  OsteoFrance
                </div>
                <div className="flex items-center gap-2 font-bold text-lg text-slate-600">
                  <div className="h-5 w-5 bg-slate-400 rounded-tr-xl" />
                  CEESO
                </div>
                <div className="flex items-center gap-2 font-bold text-lg text-slate-600">
                  <Shield className="h-5 w-5 text-slate-400" aria-hidden="true" />
                  <span>Hébergé en France (HDS)</span>
                </div>
                <div className="flex items-center gap-2 font-bold text-lg text-slate-600">
                  <Lock className="h-5 w-5 text-slate-400" aria-hidden="true" />
                  <span>Conforme RGPD</span>
                </div>
              </div>
            </div>
          </section>

          {/* Features - Linear Style */}
          <section
            id="features"
            className="py-32 bg-white"
            aria-labelledby="features-title"
          >
            <div className="container mx-auto px-6">
              <header className="text-center mb-20">
                <p className="text-sm font-medium text-indigo-600 tracking-wide uppercase mb-4">Fonctionnalités</p>
                <h2 id="features-title" className="text-4xl md:text-5xl font-semibold text-slate-900 tracking-tight mb-6">
                  Tout ce dont vous avez besoin
                </h2>
                <p className="text-lg text-slate-500 max-w-2xl mx-auto">
                  Le logiciel ostéopathe Postur réunit tous les outils pour gérer votre cabinet d&apos;ostéopathie efficacement.
                </p>
              </header>

              <div className="max-w-6xl mx-auto space-y-6">
                {/* Row 1: Body Chart + Facture-X */}
                <div className="grid md:grid-cols-5 gap-6">
                  {/* Feature 1: Body Chart - Takes 3 columns */}
                  <div className="md:col-span-3 group">
                    <div className="h-full border border-slate-200 rounded-2xl p-8 bg-white hover:border-slate-300 transition-colors">
                      <article className="space-y-4">
                        <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-slate-100">
                          <User className="h-5 w-5 text-slate-600" aria-hidden="true" />
                        </div>
                        <h3 className="text-xl font-semibold text-slate-900">
                          Body Chart interactif pour ostéopathes
                        </h3>
                        <p className="text-slate-500 leading-relaxed">
                          Cliquez directement sur les zones anatomiques. Notre <strong className="text-slate-700">Body Chart SVG interactif</strong> remplit
                          le dossier patient automatiquement et visualise l&apos;évolution des douleurs.
                        </p>
                      </article>
                      <div className="mt-6 rounded-xl overflow-hidden border border-slate-100 bg-slate-50">
                        <Image
                          src="/images/landing-page/new/body-chart-consultation.png"
                          alt="Body Chart interactif Postur - Cliquez sur les zones anatomiques pour documenter les douleurs"
                          width={600}
                          height={300}
                          className="w-full h-auto"
                          sizes="(max-width: 768px) 100vw, 60vw"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Feature 2: Facture-X - Takes 2 columns */}
                  <div id="facture-x" className="md:col-span-2 group">
                    <div className="h-full border border-slate-200 rounded-2xl p-8 bg-white hover:border-slate-300 transition-colors flex flex-col">
                      <article className="space-y-4 flex-1">
                        <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-slate-100">
                          <FileText className="h-5 w-5 text-slate-600" aria-hidden="true" />
                        </div>
                        <h3 className="text-xl font-semibold text-slate-900">
                          Facturation Facture-X
                        </h3>
                        <p className="text-slate-500 leading-relaxed">
                          La réforme <strong className="text-slate-700">facturation électronique 2026</strong> arrive.
                          Postur génère vos factures ostéopathe au format <strong className="text-slate-700">Facture-X</strong> légal automatiquement.
                        </p>
                      </article>
                      <div className="mt-6 p-4 bg-slate-50 rounded-xl border border-slate-100">
                        <code className="flex items-center gap-3 text-sm text-slate-600">
                          <Check className="h-4 w-4 text-green-500 shrink-0" aria-hidden="true" />
                          <span className="font-mono">facture_2024-001.xml</span>
                        </code>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Row 2: Réservation en ligne + Rappels - Full width */}
                <div className="group">
                  <div className="border border-slate-200 rounded-2xl p-8 lg:p-10 bg-slate-900 hover:bg-slate-800 transition-colors">
                    <div className="grid md:grid-cols-2 gap-10 items-center">
                      <article className="space-y-5">
                        <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-slate-800 border border-slate-700">
                          <Calendar className="h-5 w-5 text-slate-300" aria-hidden="true" />
                        </div>
                        <h3 className="text-2xl font-semibold text-white">
                          Réservation en ligne et rappels automatiques
                        </h3>
                        <p className="text-slate-400 leading-relaxed">
                          Arrêtez de payer 130€/mois pour un agenda. Postur inclut votre{" "}
                          <strong className="text-slate-200">page de prise de rendez-vous</strong> personnalisée
                          et des <strong className="text-slate-200">rappels automatiques par SMS et email</strong> 24h avant chaque consultation.
                        </p>
                        <ul className="space-y-2 text-sm">
                          {[
                            "Page de réservation personnalisée",
                            "Rappels SMS et email automatiques",
                            "Réduction des rendez-vous manqués",
                            "Compatible Google Maps",
                          ].map((item, i) => (
                            <li key={i} className="flex items-center gap-2 text-slate-300">
                              <Check className="h-4 w-4 text-green-400 shrink-0" aria-hidden="true" />
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                        <Link href="/signin">
                          <Button
                            className="rounded-lg bg-white text-slate-900 hover:bg-slate-100 font-medium"
                          >
                            Essayer gratuitement
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </Button>
                        </Link>
                      </article>
                      <div className="relative">
                        <div className="rounded-xl overflow-hidden border border-slate-700 shadow-2xl">
                          <Image
                            src="/images/landing-page/new/booking-page.png"
                            alt="Page de réservation en ligne Postur - Agenda ostéopathe avec rappels SMS automatiques"
                            width={500}
                            height={350}
                            className="w-full h-auto"
                            sizes="(max-width: 768px) 100vw, 400px"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Feature Deep Dive - Linear Style */}
          <section className="py-32 bg-slate-50/50" aria-label="Détail des fonctionnalités">
            <div className="container mx-auto px-6">
              {/* Body Chart Detail */}
              <article className="max-w-6xl mx-auto">
                <div className="grid md:grid-cols-2 gap-16 lg:gap-24 items-center">
                  <div className="order-2 md:order-1">
                    <div className="rounded-xl overflow-hidden border border-slate-200/80 bg-white shadow-sm">
                      <Image
                        src="/images/landing-page/new/body-chart-consultation.png"
                        alt="Interface Body Chart Postur - Visualisation anatomique interactive pour ostéopathes"
                        width={800}
                        height={500}
                        className="w-full h-auto"
                        sizes="(max-width: 768px) 100vw, 50vw"
                      />
                    </div>
                  </div>
                  <div className="order-1 md:order-2 space-y-6">
                    <h3 className="text-3xl font-semibold text-slate-900 tracking-tight">
                      Le Body Chart au cœur de votre pratique
                    </h3>
                    <p className="text-slate-500 text-lg leading-relaxed">
                      Votre métier est manuel et visuel. Votre logiciel devrait l&apos;être aussi.
                      Visualisez l&apos;évolution des douleurs d&apos;une séance à l&apos;autre en un coup d&apos;œil.
                    </p>
                    <ul className="space-y-4 pt-2" role="list">
                      {[
                        "SVG interactif haute définition",
                        "Historique visuel des douleurs",
                        "Notes SOAP intégrées",
                      ].map((item, i) => (
                        <li key={i} className="flex items-center gap-3 text-slate-600">
                          <Check className="h-5 w-5 text-slate-400 shrink-0" aria-hidden="true" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </article>

              {/* Divider */}
              <div className="max-w-6xl mx-auto my-24 lg:my-32">
                <div className="h-px bg-slate-200" />
              </div>

              {/* Billing Detail */}
              <article className="max-w-6xl mx-auto">
                <div className="grid md:grid-cols-2 gap-16 lg:gap-24 items-center">
                  <div className="space-y-6">
                    <h3 className="text-3xl font-semibold text-slate-900 tracking-tight">
                      Facturation automatisée et conforme
                    </h3>
                    <p className="text-slate-500 text-lg leading-relaxed">
                      Générez, envoyez et suivez vos factures sans effort. Compatible TVA ou franchise en base.
                      Export comptable en 1 clic.
                    </p>
                    <ul className="space-y-4 pt-2" role="list">
                      {[
                        "Facturation en 1 clic",
                        "Envoi automatique par email",
                        "Export comptable Excel/PDF",
                      ].map((item, i) => (
                        <li key={i} className="flex items-center gap-3 text-slate-600">
                          <Check className="h-5 w-5 text-slate-400 shrink-0" aria-hidden="true" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <div className="rounded-xl overflow-hidden border border-slate-200/80 bg-white shadow-sm">
                      <Image
                        src="/images/landing-page/new/billing-dashboard.png"
                        alt="Tableau de bord facturation Postur - Gestion des factures ostéopathe format Facture-X"
                        width={800}
                        height={500}
                        className="w-full h-auto"
                        sizes="(max-width: 768px) 100vw, 50vw"
                      />
                    </div>
                  </div>
                </div>
              </article>
            </div>
          </section>

          {/* Pricing - Linear Style */}
          <section id="pricing" className="py-32 bg-white" aria-labelledby="pricing-title">
            <div className="container mx-auto px-6">
              <header className="text-center mb-20">
                <p className="text-sm font-medium text-indigo-600 tracking-wide uppercase mb-4">Tarifs</p>
                <h2 id="pricing-title" className="text-4xl md:text-5xl font-semibold text-slate-900 tracking-tight mb-6">
                  Un prix simple, sans surprise
                </h2>
                <p className="text-lg text-slate-500 max-w-xl mx-auto">
                  Commencez gratuitement pendant 14 jours. Annulez à tout moment.
                </p>
              </header>

              <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-8 lg:gap-12">
                {/* Plan Pro */}
                <div className="relative group">
                  <div className="h-full border border-slate-200 rounded-2xl p-8 lg:p-10 bg-white hover:border-slate-300 transition-colors">
                    <div className="mb-8">
                      <h3 className="text-lg font-semibold text-slate-900 mb-2">Pro</h3>
                      <p className="text-slate-500 text-sm">Tout ce qu&apos;il faut pour gérer votre cabinet</p>
                    </div>

                    <div className="mb-8">
                      <div className="flex items-baseline gap-2">
                        <span className="text-5xl font-semibold tracking-tight text-slate-900">29€</span>
                        <span className="text-slate-500">/ mois TTC</span>
                      </div>
                    </div>

                    <Link href="/signin" className="block mb-10">
                      <Button
                        variant="outline"
                        className="w-full h-12 rounded-lg border-slate-200 text-slate-900 font-medium hover:bg-slate-50 hover:border-slate-300 transition-all"
                      >
                        Démarrer l&apos;essai gratuit
                      </Button>
                    </Link>

                    <div className="space-y-4">
                      {[
                        "Patients illimités",
                        "Consultations illimitées",
                        "Body Chart interactif",
                        "Facturation Facture-X 2026",
                        "Réservation en ligne",
                        "Rappels SMS & email automatiques",
                        "Support prioritaire",
                        "Hébergement HDS France",
                      ].map((feature, i) => (
                        <div key={i} className="flex items-start gap-3">
                          <Check className="h-5 w-5 text-slate-400 shrink-0 mt-0.5" aria-hidden="true" />
                          <span className="text-slate-600 text-[15px]">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Plan Pro + IA */}
                <div className="relative group">
                  <div className="absolute -inset-[1px] bg-gradient-to-b from-indigo-500 to-violet-500 rounded-2xl opacity-100" />
                  <div className="relative h-full border border-transparent rounded-2xl p-8 lg:p-10 bg-white">
                    <div className="absolute -top-3 left-6">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-indigo-600 text-white">
                        Recommandé
                      </span>
                    </div>

                    <div className="mb-8">
                      <h3 className="text-lg font-semibold text-slate-900 mb-2">Pro + IA</h3>
                      <p className="text-slate-500 text-sm">L&apos;intelligence artificielle pour gagner du temps</p>
                    </div>

                    <div className="mb-8">
                      <div className="flex items-baseline gap-2">
                        <span className="text-5xl font-semibold tracking-tight text-slate-900">39€</span>
                        <span className="text-slate-500">/ mois TTC</span>
                      </div>
                    </div>

                    <Link href="/signin" className="block mb-10">
                      <Button
                        className="w-full h-12 rounded-lg bg-slate-900 text-white font-medium hover:bg-slate-800 transition-all"
                      >
                        Démarrer l&apos;essai gratuit
                      </Button>
                    </Link>

                    <div className="space-y-4">
                      <div className="flex items-start gap-3">
                        <Check className="h-5 w-5 text-indigo-500 shrink-0 mt-0.5" aria-hidden="true" />
                        <span className="text-slate-900 font-medium text-[15px]">Tout le plan Pro, plus :</span>
                      </div>
                      {[
                        "Assistant IA en consultation",
                        "Résumé automatique des séances",
                        "Suggestions diagnostiques IA",
                        "Notes intelligentes",
                        "Accès prioritaire aux nouveautés",
                      ].map((feature, i) => (
                        <div key={i} className="flex items-start gap-3">
                          <Check className="h-5 w-5 text-indigo-500 shrink-0 mt-0.5" aria-hidden="true" />
                          <span className="text-slate-600 text-[15px]">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <p className="text-center text-sm text-slate-400 mt-12">
                Prix TTC. Sans engagement, annulable à tout moment.
              </p>
            </div>
          </section>

          {/* FAQ */}
          <section className="py-24 bg-white" aria-labelledby="faq-title">
            <div className="container mx-auto px-6 max-w-3xl">
              <header className="text-center mb-12">
                <h2 id="faq-title" className="text-3xl font-bold text-slate-900">
                  Questions fréquentes sur le logiciel ostéopathe
                </h2>
              </header>
              <FAQ />
            </div>
          </section>
        </main>

        {/* Footer */}
        <footer className="bg-slate-50 border-t border-slate-100 py-16" role="contentinfo">
          <div className="container mx-auto px-6 grid md:grid-cols-4 gap-12">
            <div className="col-span-2">
              <div className="flex items-center gap-2 mb-6">
                <Image
                  src="/images/logo/logo.svg"
                  alt="Postur - Logiciel de gestion pour ostéopathes"
                  width={40}
                  height={40}
                  className="h-10 w-auto"
                />
                <span className="text-xl font-bold tracking-tighter text-slate-900">POSTUR</span>
              </div>
              <p className="max-w-sm text-slate-500 leading-relaxed">
                <strong>Postur</strong> : le logiciel de gestion de cabinet moderne pour les ostéopathes exigeants.
                <br />
                Gagnez du temps sur l&apos;administratif, sécurisez votre pratique.
              </p>
            </div>
            <nav aria-label="Navigation produit">
              <h3 className="font-bold text-slate-900 mb-6">Produit</h3>
              <ul className="space-y-4 text-sm text-slate-500">
                <li>
                  <Link href="#features" className="hover:text-indigo-600 transition-colors">
                    Fonctionnalités
                  </Link>
                </li>
                <li>
                  <Link href="#pricing" className="hover:text-indigo-600 transition-colors">
                    Tarifs
                  </Link>
                </li>
                <li>
                  <Link href="/signin?tab=signin" className="hover:text-indigo-600 transition-colors">
                    Connexion
                  </Link>
                </li>
              </ul>
            </nav>
            <nav aria-label="Navigation légale">
              <h3 className="font-bold text-slate-900 mb-6">Légal</h3>
              <ul className="space-y-4 text-sm text-slate-500">
                <li>
                  <Link href="#" className="hover:text-indigo-600 transition-colors">
                    Mentions Légales
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-indigo-600 transition-colors">
                    Politique de Confidentialité
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-indigo-600 transition-colors">
                    CGV
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-indigo-600 transition-colors">
                    Contact
                  </Link>
                </li>
              </ul>
            </nav>
          </div>
          <div className="container mx-auto px-6 pt-8 mt-12 border-t border-slate-200 text-center text-sm text-slate-400 flex flex-col md:flex-row justify-between items-center gap-4">
            <p>&copy; 2025 Postur. Fait avec passion en France.</p>
            <p className="text-xs opacity-70">
              Logiciel ostéopathe Mac &amp; PC | Gestion cabinet ostéopathie | Facture-X ostéopathe | Alternative
              Doctolib
            </p>
          </div>
        </footer>
      </div>
    </>
  )
}
