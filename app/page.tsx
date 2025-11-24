"use client"

import * as React from "react"
import Link from "next/link"
import Image from "next/image"
import { motion } from "framer-motion"
import { ArrowRight, Check, Menu, Shield, Calendar, FileText, User, Lock } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 selection:bg-indigo-100 selection:text-indigo-900 overflow-x-hidden">
      
      {/* Navbar (Sticky) */}
      <nav className="sticky top-0 z-50 w-full border-b border-slate-100 bg-white/80 backdrop-blur-md">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
             <Image
               src="/images/logo/logo.svg"
               alt="Postur"
               width={40}
               height={40}
               className="h-10 w-auto transition-transform group-hover:scale-105"
             />
             <span className="text-xl font-bold tracking-tighter text-slate-900">POSTUR</span>
          </Link>

          {/* Desktop Links */}
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
            <Link href="#features" className="hover:text-indigo-600 transition-colors">Fonctionnalités</Link>
            <Link href="#facture-x" className="hover:text-indigo-600 transition-colors">Facture-X</Link>
            <Link href="#pricing" className="hover:text-indigo-600 transition-colors">Tarifs</Link>
          </div>

          {/* CTA Droite */}
          <div className="hidden md:flex items-center gap-4">
            <Link href="/signin">
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
           <div className="md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="text-slate-900">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                 <div className="flex flex-col gap-8 mt-10">
                    <Link href="#features" className="text-lg font-medium text-slate-900 hover:text-indigo-600">Fonctionnalités</Link>
                    <Link href="#facture-x" className="text-lg font-medium text-slate-900 hover:text-indigo-600">Facture-X</Link>
                    <Link href="#pricing" className="text-lg font-medium text-slate-900 hover:text-indigo-600">Tarifs</Link>
                    <hr className="border-slate-100" />
                    <div className="flex flex-col gap-4">
                      <Link href="/signin">
                        <Button variant="ghost" className="w-full justify-start text-slate-600">Connexion</Button>
                      </Link>
                      <Link href="/signin">
                        <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-full">Essai Gratuit</Button>
                      </Link>
                    </div>
                 </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </nav>

      <main>
        {/* Hero Section (The Hook) */}
        <section className="pt-24 pb-32 relative overflow-hidden bg-slate-50/50">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-100/50 via-transparent to-transparent pointer-events-none"></div>
          
          <div className="container mx-auto px-6 relative z-10">
            <div className="flex flex-col items-center text-center max-w-4xl mx-auto mb-16">
                
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="mb-8"
                >
                    <Badge variant="secondary" className="px-4 py-1.5 rounded-full bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-100 text-sm font-medium gap-2">
                        🚀 Conforme Facture-X 2026
                    </Badge>
                </motion.div>

                <motion.h1 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.1 }}
                  className="text-5xl md:text-7xl font-bold tracking-tight text-slate-900 mb-6 leading-[1.1]"
                >
                  La gestion de cabinet, <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">enfin redressée.</span>
                </motion.h1>
                
                <motion.p 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  className="text-xl text-slate-600 leading-relaxed max-w-2xl mx-auto mb-10"
                >
                  Le premier logiciel pour Ostéopathes qui combine Body Chart interactif, Facture-X native et Réservation en ligne. Sans l&apos;usine à gaz.
                </motion.p>
                
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                  className="flex flex-col items-center gap-4"
                >
                    <Link href="/signin">
                        <Button size="lg" className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full px-8 h-14 text-lg font-medium shadow-xl shadow-indigo-600/20 transition-all hover:scale-105 group">
                            Commencer l&apos;essai gratuit <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                        </Button>
                    </Link>
                    <p className="text-sm text-slate-500 font-medium">
                      14 jours offerts • Pas de CB requise • Installation en 2 min
                    </p>
                </motion.div>
            </div>

            {/* Visual (Hero Image) */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, rotateX: 10 }}
              animate={{ opacity: 1, scale: 1, rotateX: 0 }}
              transition={{ duration: 0.8, delay: 0.4, type: "spring" }}
              className="relative max-w-5xl mx-auto perspective-1000"
            >
                 <div className="relative rounded-2xl bg-slate-900 p-2 shadow-2xl shadow-indigo-500/20 ring-1 ring-slate-900/5 transform transition-transform">
                    <div className="relative aspect-[16/10] rounded-xl overflow-hidden bg-white">
                        <Image 
                            src="/images/interface/Gemini_Generated_Image_wug50awug50awug5 (2).jpeg"
                            alt="Postur Dashboard"
                            fill
                            className="object-cover"
                            priority
                        />
                        <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/10 to-transparent pointer-events-none mix-blend-overlay"></div>
                    </div>
                 </div>
                 {/* Glow Effect */}
                 <div className="absolute -inset-4 bg-indigo-500/20 blur-3xl -z-10 rounded-[3rem]"></div>
            </motion.div>
          </div>
        </section>
        
        {/* Social Proof */}
        <section className="py-10 border-b border-slate-100 bg-white">
            <div className="container mx-auto px-6">
                <p className="text-center text-sm font-semibold text-slate-400 mb-8">Conçu avec les retours de 50+ ostéopathes indépendants</p>
                <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 opacity-60 grayscale transition-all hover:grayscale-0 duration-500">
                     {/* Logos placeholders */}
                     <div className="flex items-center gap-2 font-bold text-lg text-slate-600"><div className="h-5 w-5 bg-slate-400 rounded-full"></div>OsteoFrance</div>
                     <div className="flex items-center gap-2 font-bold text-lg text-slate-600"><div className="h-5 w-5 bg-slate-400 rounded-tr-xl"></div>CEESO</div>
                     <div className="flex items-center gap-2 font-bold text-lg text-slate-600"><Shield className="h-5 w-5 text-slate-400" />Hébergé en France</div>
                     <div className="flex items-center gap-2 font-bold text-lg text-slate-600"><Lock className="h-5 w-5 text-slate-400" />RGPD Compliant</div>
                </div>
            </div>
        </section>

        {/* Bento Grid "Problem/Solution" */}
        <section id="features" className="py-24 bg-slate-50">
            <div className="container mx-auto px-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                     
                     {/* Card 1: Interface */}
                     <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        whileHover={{ scale: 1.02 }}
                        transition={{ duration: 0.4 }}
                        className="md:col-span-2 bg-white rounded-3xl p-8 shadow-lg shadow-slate-200/50 border border-slate-100 flex flex-col md:flex-row gap-8 items-center overflow-hidden"
                     >
                        <div className="flex-1 space-y-4">
                             <div className="h-12 w-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
                                <User className="h-6 w-6" />
                             </div>
                             <h3 className="text-2xl font-bold text-slate-900">Fini les clics inutiles.</h3>
                             <p className="text-slate-600">Ne tapez plus &quot;Douleur lombaire&quot;. Cliquez sur les lombaires. Notre Body Chart interactif remplit le dossier pour vous automatiquement.</p>
                        </div>
                        <div className="flex-1 relative w-full h-48 md:h-auto bg-slate-50 rounded-xl border border-slate-100 overflow-hidden flex items-center justify-center">
                             {/* Placeholder for Body Chart Visual */}
                             <div className="relative w-full h-full">
                                <Image 
                                  src="/images/interface/Gemini_Generated_Image_hdxo9ghdxo9ghdxo.jpeg" 
                                  alt="Body Chart"
                                  fill
                                  className="object-cover opacity-90"
                                />
                             </div>
                        </div>
                     </motion.div>

                     {/* Card 2: Facture-X */}
                     <motion.div 
                        id="facture-x"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.4, delay: 0.1 }}
                        whileHover={{ scale: 1.02 }}
                        className="bg-white rounded-3xl p-8 shadow-lg shadow-slate-200/50 border border-slate-100 flex flex-col justify-between"
                     >
                        <div className="space-y-4">
                            <div className="h-12 w-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
                                <FileText className="h-6 w-6" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900">Prêt pour la Facture-X.</h3>
                            <p className="text-slate-600 text-sm">La réforme 2026 arrive. Postur génère vos factures au format légal automatiquement. Dormez tranquille.</p>
                        </div>
                        <div className="mt-6 p-4 bg-slate-50 rounded-xl border border-slate-100">
                            <div className="flex items-center gap-3 text-xs font-mono text-slate-500">
                                <Check className="h-4 w-4 text-green-500" /> format_factur-x.xml
                            </div>
                        </div>
                     </motion.div>

                     {/* Card 3: Reservation */}
                     <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.4, delay: 0.2 }}
                        whileHover={{ scale: 1.02 }}
                        className="md:col-span-3 bg-indigo-900 rounded-3xl p-8 shadow-xl shadow-indigo-900/20 border border-indigo-800 flex flex-col md:flex-row gap-8 items-center text-white overflow-hidden relative"
                     >
                        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/30 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                        <div className="flex-1 space-y-4 relative z-10">
                             <div className="h-12 w-12 bg-indigo-800/50 rounded-2xl flex items-center justify-center text-indigo-300 border border-indigo-700">
                                <Calendar className="h-6 w-6" />
                             </div>
                             <h3 className="text-2xl font-bold">Votre propre page de réservation.</h3>
                             <p className="text-indigo-200 max-w-lg">Arrêtez de payer 130€/mois pour un agenda. Postur inclut votre page de prise de RDV compatible Google Maps et Doctolib (via lien externe).</p>
                             <Button variant="secondary" className="rounded-full text-indigo-900 font-medium">Voir un exemple</Button>
                        </div>
                        <div className="flex-1 relative w-full max-w-sm aspect-[4/3] bg-white rounded-xl overflow-hidden shadow-2xl border border-indigo-100/20">
                             {/* Mockup Reservation */}
                             <div className="absolute inset-0 flex flex-col">
                                <div className="h-4 bg-slate-100 border-b flex items-center px-2 gap-1">
                                    <div className="h-1.5 w-1.5 rounded-full bg-slate-300"></div>
                                    <div className="h-1.5 w-1.5 rounded-full bg-slate-300"></div>
                                </div>
                                <div className="p-4 flex-1 bg-white">
                                    <div className="h-4 w-1/2 bg-slate-100 rounded mb-2"></div>
                                    <div className="h-2 w-1/3 bg-slate-100 rounded mb-6"></div>
                                    <div className="grid grid-cols-3 gap-2">
                                        <div className="h-10 bg-indigo-50 rounded border border-indigo-100"></div>
                                        <div className="h-10 bg-indigo-50 rounded border border-indigo-100"></div>
                                        <div className="h-10 bg-indigo-50 rounded border border-indigo-100"></div>
                                    </div>
                                </div>
                             </div>
                        </div>
                     </motion.div>
                </div>
            </div>
        </section>

        {/* Feature Deep Dive */}
        <section className="py-24 bg-white">
            <div className="container mx-auto px-6 space-y-32">
                
                {/* Bloc 1: Body Chart */}
                <div className="flex flex-col md:flex-row items-center gap-16">
                    <div className="flex-1 relative group">
                        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl transform rotate-2 group-hover:rotate-1 transition-transform opacity-10"></div>
                        <div className="relative bg-white rounded-2xl border border-slate-100 shadow-2xl overflow-hidden aspect-video">
                            <Image 
                                src="/images/interface/Gemini_Generated_Image_hdxo9ghdxo9ghdxo (1).jpeg" 
                                alt="Body Chart Interface" 
                                fill 
                                className="object-cover"
                            />
                        </div>
                    </div>
                    <div className="flex-1 space-y-6">
                        <h3 className="text-3xl font-bold text-slate-900">Le visuel au cœur du soin.</h3>
                        <p className="text-lg text-slate-600 leading-relaxed">
                            Votre métier est manuel et visuel. Votre logiciel devrait l&apos;être aussi. Visualisez l&apos;évolution des douleurs de vos patients d&apos;une séance à l&apos;autre en un coup d&apos;œil.
                        </p>
                        <ul className="space-y-3">
                            {["SVG Interactif", "Historique visuel des douleurs", "Notes SOAP rapides"].map((item, i) => (
                                <li key={i} className="flex items-center gap-3 text-slate-700 font-medium">
                                    <div className="h-6 w-6 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center">
                                        <Check className="h-3.5 w-3.5" />
                                    </div>
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Bloc 2: Facturation */}
                <div className="flex flex-col md:flex-row-reverse items-center gap-16">
                    <div className="flex-1 relative group">
                        <div className="absolute inset-0 bg-gradient-to-l from-blue-500 to-indigo-500 rounded-2xl transform -rotate-2 group-hover:-rotate-1 transition-transform opacity-10"></div>
                        <div className="relative bg-white rounded-2xl border border-slate-100 shadow-2xl overflow-hidden aspect-video">
                            <Image 
                                src="/images/interface/Gemini_Generated_Image_wug50awug50awug5 (3).jpeg" 
                                alt="Billing Interface" 
                                fill 
                                className="object-cover"
                            />
                        </div>
                    </div>
                    <div className="flex-1 space-y-6">
                        <h3 className="text-3xl font-bold text-slate-900">L&apos;administratif en pilote automatique.</h3>
                        <p className="text-lg text-slate-600 leading-relaxed">
                            Générez, envoyez et suivez vos factures sans effort. Compatible TVA (ou franchise en base). Export comptable en 1 clic.
                        </p>
                        <ul className="space-y-3">
                            {["Facturation en 1 clic", "Envoi par email automatique", "Export Comptable"].map((item, i) => (
                                <li key={i} className="flex items-center gap-3 text-slate-700 font-medium">
                                    <div className="h-6 w-6 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center">
                                        <Check className="h-3.5 w-3.5" />
                                    </div>
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

            </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="py-24 bg-slate-50">
            <div className="container mx-auto px-6">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Un tarif unique. Simple.</h2>
                    <p className="text-slate-600">Pas de frais cachés. Pas de modules payants.</p>
                </div>

                <div className="max-w-lg mx-auto">
                    <Card className="border-0 shadow-2xl shadow-indigo-500/10 rounded-3xl overflow-hidden">
                        <CardHeader className="bg-indigo-600 text-white text-center py-10">
                            <CardTitle className="text-2xl font-medium">Abonnement Pro</CardTitle>
                            <div className="flex items-baseline justify-center gap-1 mt-4">
                                <span className="text-5xl font-bold">29€</span>
                                <span className="text-indigo-200">/ mois</span>
                            </div>
                            <p className="text-indigo-100 text-sm mt-2">Sans engagement. Annulable à tout moment.</p>
                        </CardHeader>
                        <CardContent className="p-8">
                            <ul className="space-y-4 mb-8">
                                {[
                                    "Patients illimités",
                                    "Consultations illimitées",
                                    "Body Chart interactif inclus",
                                    "Module Facture-X inclus",
                                    "Page de réservation en ligne incluse",
                                    "Support par chat prioritaire"
                                ].map((feature, i) => (
                                    <li key={i} className="flex items-center gap-3 text-slate-700">
                                        <div className="h-5 w-5 rounded-full bg-green-100 text-green-600 flex items-center justify-center shrink-0">
                                            <Check className="h-3 w-3" />
                                        </div>
                                        {feature}
                                    </li>
                                ))}
                            </ul>
                            <Link href="/signin">
                                <Button className="w-full bg-slate-900 hover:bg-slate-800 text-white rounded-full h-12 text-lg shadow-lg transition-transform hover:scale-[1.02]">
                                    Commencer l&apos;essai gratuit
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </section>

        {/* FAQ */}
        <section className="py-24 bg-white">
            <div className="container mx-auto px-6 max-w-3xl">
                <h2 className="text-3xl font-bold text-center text-slate-900 mb-12">Questions Fréquentes</h2>
                
                <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="item-1" className="border-slate-100">
                        <AccordionTrigger className="text-slate-900 hover:text-indigo-600 hover:no-underline">Est-ce que mes données sont en sécurité ?</AccordionTrigger>
                        <AccordionContent className="text-slate-600">
                            Oui, nous utilisons un hébergement chiffré et conforme aux standards de santé (HDS). Vos données vous appartiennent et sont sauvegardées quotidiennement en France.
                        </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="item-2" className="border-slate-100">
                        <AccordionTrigger className="text-slate-900 hover:text-indigo-600 hover:no-underline">Je suis chez Doctolib/Autre, je peux importer mes patients ?</AccordionTrigger>
                        <AccordionContent className="text-slate-600">
                            Oui, nous proposons un outil d&apos;import Excel/CSV simple pour récupérer votre base patientèle en quelques minutes. Notre support peut vous assister gratuitement dans cette démarche.
                        </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="item-3" className="border-slate-100">
                        <AccordionTrigger className="text-slate-900 hover:text-indigo-600 hover:no-underline">La Facture-X est-elle obligatoire ?</AccordionTrigger>
                        <AccordionContent className="text-slate-600">
                            Elle le deviendra progressivement pour toutes les entreprises assujetties à la TVA dès 2026 (réception) et 2027 (émission). S&apos;équiper maintenant avec Postur, c&apos;est éviter la panique plus tard et moderniser votre gestion dès aujourd&apos;hui.
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>
            </div>
        </section>

        {/* Footer */}
        <footer className="bg-slate-50 border-t border-slate-100 py-16">
             <div className="container mx-auto px-6 grid md:grid-cols-4 gap-12">
                 <div className="col-span-2">
                     <div className="flex items-center gap-2 mb-6">
                        <Image
                          src="/images/logo/logo.svg"
                          alt="Postur"
                          width={40}
                          height={40}
                          className="h-10 w-auto"
                        />
                        <span className="text-xl font-bold tracking-tighter text-slate-900">POSTUR</span>
                     </div>
                     <p className="max-w-sm text-slate-500 leading-relaxed">
                         Le logiciel moderne pour les ostéopathes exigeants. <br />
                         Gagnez du temps, sécurisez votre pratique.
                     </p>
                 </div>
                 <div>
                     <h4 className="font-bold text-slate-900 mb-6">Produit</h4>
                     <ul className="space-y-4 text-sm text-slate-500">
                         <li><Link href="#features" className="hover:text-indigo-600 transition-colors">Fonctionnalités</Link></li>
                         <li><Link href="#pricing" className="hover:text-indigo-600 transition-colors">Tarifs</Link></li>
                         <li><Link href="/signin" className="hover:text-indigo-600 transition-colors">Connexion</Link></li>
                     </ul>
                 </div>
                 <div>
                     <h4 className="font-bold text-slate-900 mb-6">Légal</h4>
                     <ul className="space-y-4 text-sm text-slate-500">
                         <li><Link href="#" className="hover:text-indigo-600 transition-colors">Mentions Légales</Link></li>
                         <li><Link href="#" className="hover:text-indigo-600 transition-colors">Confidentialité</Link></li>
                         <li><Link href="#" className="hover:text-indigo-600 transition-colors">CGV</Link></li>
                         <li><Link href="#" className="hover:text-indigo-600 transition-colors">Contact</Link></li>
                     </ul>
                 </div>
             </div>
             <div className="container mx-auto px-6 pt-8 mt-12 border-t border-slate-200 text-center text-sm text-slate-400 flex flex-col md:flex-row justify-between items-center gap-4">
                 <p>&copy; 2025 Postur. Fait avec ❤️ en France.</p>
                 <p className="text-xs opacity-70">Logiciel Ostéopathe Mac & PC. Gestion cabinet ostéopathie. Facture-X Ostéopathe. Alternative Doctolib.</p>
             </div>
        </footer>
      </main>
    </div>
  )
}