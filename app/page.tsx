import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Star, Menu, Calendar, Users, Settings, ChevronLeft } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

// --- CUSTOM MOCKUP COMPONENT ---

function MobileBookingWidget() {
    return (
        <div className="w-full h-full bg-white flex flex-col font-sans text-xs relative overflow-hidden">
            {/* Header */}
            <div className="bg-slate-900 text-white p-4 pb-6">
                <div className="flex items-center gap-3 mb-2">
                    <ChevronLeft className="h-4 w-4 text-slate-400" />
                    <div className="font-medium">Prendre rendez-vous</div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center text-sm font-bold">DM</div>
                    <div>
                        <div className="font-bold text-sm">Dr. Martin</div>
                        <div className="text-[10px] text-slate-400">Ostéopathe D.O.</div>
                    </div>
                </div>
            </div>
            
            <div className="flex-1 bg-slate-50 p-3 rounded-t-2xl -mt-4 shadow-inner overflow-hidden flex flex-col gap-3">
                 {/* Service Selection */}
                 <div className="bg-white p-3 rounded-xl shadow-sm border border-slate-100">
                     <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Motif de consultation</div>
                     <div className="flex justify-between items-center p-2 bg-blue-50 border border-blue-100 rounded-lg">
                         <span className="font-semibold text-blue-900">Consultation Adulte</span>
                         <Badge className="bg-blue-600 hover:bg-blue-700 h-5 px-1.5 text-[9px]">60 €</Badge>
                     </div>
                 </div>

                 {/* Time Slots */}
                 <div className="bg-white p-3 rounded-xl shadow-sm border border-slate-100 flex-1">
                     <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Disponibilités</div>
                     <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                         <div className="flex-shrink-0 px-3 py-1 bg-slate-900 text-white rounded-full text-[10px] font-medium">Auj.</div>
                         <div className="flex-shrink-0 px-3 py-1 bg-white border text-slate-500 rounded-full text-[10px]">Dem.</div>
                         <div className="flex-shrink-0 px-3 py-1 bg-white border text-slate-500 rounded-full text-[10px]">Lun.</div>
                     </div>
                     <div className="grid grid-cols-3 gap-2 mt-1">
                         <div className="p-2 rounded-lg border border-slate-100 text-center text-slate-300 line-through text-[10px]">09:00</div>
                         <div className="p-2 rounded-lg bg-blue-600 text-white text-center font-bold shadow-md shadow-blue-200 text-[10px]">10:30</div>
                         <div className="p-2 rounded-lg border border-slate-200 text-center text-slate-700 hover:bg-slate-50 text-[10px]">11:15</div>
                         <div className="p-2 rounded-lg border border-slate-200 text-center text-slate-700 hover:bg-slate-50 text-[10px]">14:00</div>
                         <div className="p-2 rounded-lg border border-slate-200 text-center text-slate-700 hover:bg-slate-50 text-[10px]">15:45</div>
                         <div className="p-2 rounded-lg border border-slate-200 text-center text-slate-700 hover:bg-slate-50 text-[10px]">16:30</div>
                     </div>
                 </div>

                 <Button className="w-full bg-slate-900 text-white h-8 text-xs shadow-lg mt-auto">Confirmer</Button>
            </div>
        </div>
    )
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#F3F6FC] font-sans text-slate-900">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 w-full bg-[#F3F6FC]/80 backdrop-blur-md border-b border-slate-200/50">
        <div className="container mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
             <Image src="/images/logo.svg" alt="TheraFlow Logo" width={32} height={32} />
             <span className="text-xl font-bold text-slate-900 tracking-tight">TheraFlow</span>
          </div>

          {/* Desktop Links */}
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
            <Link href="#features" className="hover:text-blue-600 transition-colors">Fonctionnalités</Link>
            <Link href="#testimonials" className="hover:text-blue-600 transition-colors">Témoignages</Link>
            <Link href="#pricing" className="hover:text-blue-600 transition-colors">Tarifs</Link>
          </div>

          {/* Actions */}
          <div className="hidden md:flex items-center gap-4">
            <Link href="/signin" className="text-sm font-medium text-slate-900 hover:text-blue-600">Log in</Link>
            <Link href="/signin">
                <Button className="bg-[#4B6BFB] hover:bg-[#3a56d4] text-white rounded-lg px-6 py-2.5 font-medium shadow-lg shadow-blue-600/20">
                    Essayer gratuitement
                </Button>
            </Link>
          </div>

           {/* Mobile Menu */}
           <div className="md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon"><Menu className="h-6 w-6" /></Button>
              </SheetTrigger>
              <SheetContent>
                 <div className="flex flex-col gap-6 mt-8">
                    <Link href="#features" className="text-lg font-medium">Fonctionnalités</Link>
                    <Link href="#testimonials" className="text-lg font-medium">Témoignages</Link>
                    <Link href="#pricing" className="text-lg font-medium">Tarifs</Link>
                    <hr />
                    <Link href="/signin"><Button variant="ghost" className="w-full justify-start">Log in</Button></Link>
                    <Link href="/signin"><Button className="w-full bg-[#4B6BFB]">Essayer gratuitement</Button></Link>
                 </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </nav>

      <main>
        {/* Hero Section */}
        <section className="pt-16 pb-32 overflow-hidden relative">
          <div className="container mx-auto px-6 relative z-10">
            <div className="flex flex-col lg:flex-row items-center gap-16">
              
              {/* Text Content */}
              <div className="flex-1 max-w-2xl space-y-8 text-center lg:text-left">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-xs font-semibold uppercase tracking-wider mb-2">
                    <Badge variant="secondary" className="bg-blue-600 text-white hover:bg-blue-700 border-none px-1.5 py-0 rounded-sm text-[10px] mr-1">NOUVEAU</Badge>
                    Gestion des factures automatisée
                </div>
                <h1 className="text-5xl md:text-6xl lg:text-[4.5rem] leading-[1.1] font-bold text-slate-900 tracking-tight">
                  Gérez votre cabinet <br className="hidden lg:block" />
                  <span className="text-[#4B6BFB]">sans effort.</span>
                </h1>
                <p className="text-lg md:text-xl text-slate-600 leading-relaxed max-w-xl mx-auto lg:mx-0">
                  La solution tout-en-un pour les Ostéopathes, Naturopathes et Sophrologues. Libérez-vous de l'administratif.
                </p>
                
                <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
                    <Link href="/signin">
                        <Button className="h-14 px-8 text-lg bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow-xl shadow-slate-900/10 transition-transform hover:scale-105">
                            Essayer gratuitement
                        </Button>
                    </Link>
                    <Link href="#features">
                        <Button variant="ghost" className="h-14 px-8 text-lg text-slate-700 hover:bg-slate-200/50 rounded-xl">
                            Découvrir
                        </Button>
                    </Link>
                </div>
                
                <div className="flex items-center justify-center lg:justify-start gap-6 text-sm text-slate-500 pt-4">
                     <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-500" /> Sans engagement</div>
                     <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-500" /> 14 jours offerts</div>
                </div>
              </div>

              {/* Visual Mockup */}
              <div className="flex-1 relative w-full flex justify-center lg:justify-end scale-[0.85] sm:scale-100 origin-top">
                 <div className="relative w-full max-w-[800px]">
                    
                    {/* Laptop Frame - Main Dashboard Image (Uncropped) */}
                    <div className="relative z-10 bg-white rounded-xl shadow-2xl border border-slate-200 p-2 md:p-3 ring-1 ring-slate-900/5">
                        <div className="relative aspect-[16/10] bg-slate-100 rounded-lg overflow-hidden border border-slate-100">
                            <Image 
                                src="/images/interface/Gemini_Generated_Image_wug50awug50awug5 (2).jpeg" 
                                alt="Tableau de bord TheraFlow"
                                fill
                                className="object-cover"
                                priority
                            />
                        </div>
                        {/* Laptop Base */}
                         <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-[110%] h-4 bg-[#E2E8F0] rounded-b-xl -z-10 shadow-lg"></div>
                    </div>

                    {/* Phone Frame - Custom Code Widget */}
                    <div className="absolute -bottom-12 -right-4 md:-right-12 w-[140px] md:w-[220px] z-20 bg-white rounded-[2.5rem] border-[8px] border-white shadow-2xl ring-1 ring-slate-900/5">
                        <div className="relative aspect-[9/19] bg-slate-900 rounded-[2rem] overflow-hidden border border-slate-100">
                             <MobileBookingWidget />
                        </div>
                        {/* Notch Mockup */}
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[40%] h-4 bg-white rounded-b-xl z-30"></div>
                    </div>

                     {/* Floating Notification Card */}
                    <div className="absolute -bottom-20 left-0 md:-left-12 bg-white p-4 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-slate-100 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-500 z-30 max-w-[240px]">
                        <div className="flex items-start gap-3">
                           <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                              <CheckCircle2 className="h-5 w-5 text-green-600" />
                           </div>
                           <div>
                              <p className="font-bold text-slate-900 text-sm">Rendez-vous confirmé</p>
                              <p className="text-xs text-slate-500 mt-1">Mme. Durand - 14:00</p>
                           </div>
                        </div>
                     </div>

                     {/* Decorative Background Blur */}
                     <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150%] h-[150%] bg-gradient-to-tr from-blue-200/40 to-purple-200/40 blur-3xl rounded-full -z-20 pointer-events-none"></div>
                 </div>
              </div>
            </div>
          </div>
        </section>
        
        {/* Logos Section */}
        <section className="py-12 border-y border-slate-200/60 bg-white/50">
            <div className="container mx-auto px-6">
                <p className="text-center text-sm font-semibold text-slate-400 uppercase tracking-widest mb-8">Ils nous font confiance</p>
                <div className="flex flex-wrap justify-center items-center gap-8 md:gap-20 opacity-40 grayscale hover:grayscale-0 transition-all duration-500">
                     <div className="text-xl font-bold text-slate-800 flex items-center gap-2"><div className="h-6 w-6 bg-slate-800 rounded-full"></div>OsteoPlus</div>
                     <div className="text-xl font-bold text-slate-800 flex items-center gap-2"><div className="h-6 w-6 bg-slate-800 rounded-tr-xl"></div>SanteNaturo</div>
                     <div className="text-xl font-bold text-slate-800 flex items-center gap-2"><div className="h-6 w-6 bg-slate-800 rounded-sm rotate-45"></div>ZenSophro</div>
                     <div className="text-xl font-bold text-slate-800 flex items-center gap-2"><div className="h-6 w-6 bg-slate-800 rounded-full border-4 border-white ring-1 ring-slate-800"></div>MedLink</div>
                </div>
            </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-24 bg-white">
            <div className="container mx-auto px-6">
                <div className="text-center max-w-3xl mx-auto mb-20">
                    <h2 className="text-3xl md:text-5xl font-bold text-slate-900 mb-6">Tout pour votre réussite</h2>
                    <p className="text-xl text-slate-500">Des outils puissants, une interface simple. Conçus pour votre quotidien.</p>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                     {/* Feature 1: Agenda */}
                     <div className="bg-[#F8FAFC] rounded-3xl p-8 border border-slate-100 hover:border-blue-100 hover:shadow-xl transition-all duration-300 group flex flex-col">
                        <div className="h-12 w-12 bg-blue-600 rounded-2xl flex items-center justify-center mb-6 text-white shadow-lg shadow-blue-600/20 group-hover:scale-110 transition-transform">
                            <Calendar className="h-6 w-6" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-3">Agenda Intelligent</h3>
                        <p className="text-slate-600 mb-6">Synchronisation automatique et rappels SMS.</p>
                        {/* Image Integration */}
                        <div className="flex-1 bg-white rounded-xl shadow-sm border overflow-hidden relative h-64">
                             <Image 
                                src="/images/interface/Gemini_Generated_Image_hdxo9ghdxo9ghdxo.jpeg" 
                                alt="Agenda Interface" 
                                fill 
                                className="object-cover object-top" 
                            />
                        </div>
                     </div>

                     {/* Feature 2: Patient Files */}
                     <div className="bg-[#F8FAFC] rounded-3xl p-8 border border-slate-100 hover:border-green-100 hover:shadow-xl transition-all duration-300 group md:col-span-2 flex flex-col">
                        <div className="flex flex-col h-full">
                            <div className="flex items-start justify-between mb-6">
                                <div>
                                    <div className="h-12 w-12 bg-green-500 rounded-2xl flex items-center justify-center mb-6 text-white shadow-lg shadow-green-500/20 group-hover:scale-110 transition-transform">
                                         <Users className="h-6 w-6" />
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-900 mb-3">Dossiers & Schémas Corporels</h3>
                                    <p className="text-slate-600 max-w-md">Notes de consultation détaillées avec schémas interactifs pour un suivi précis.</p>
                                </div>
                            </div>
                            {/* Image Integration */}
                            <div className="relative flex-1 min-h-[250px] rounded-xl overflow-hidden shadow-sm border bg-white">
                                 <Image 
                                    src="/images/interface/Gemini_Generated_Image_wug50awug50awug5 (2).jpeg" 
                                    alt="Consultation Interface" 
                                    fill 
                                    className="object-cover object-top" 
                                />
                            </div>
                        </div>
                     </div>

                     {/* Feature 3: Billing */}
                     <div className="bg-[#F8FAFC] rounded-3xl p-8 border border-slate-100 hover:border-purple-100 hover:shadow-xl transition-all duration-300 group md:col-span-3 flex flex-col md:flex-row items-center gap-12">
                         <div className="flex-1">
                            <div className="h-12 w-12 bg-purple-500 rounded-2xl flex items-center justify-center mb-6 text-white shadow-lg shadow-purple-500/20 group-hover:scale-110 transition-transform">
                                <Settings className="h-6 w-6" />
                            </div>
                            <h3 className="text-2xl font-bold text-slate-900 mb-4">Facturation Automatisée</h3>
                            <p className="text-lg text-slate-600 mb-6">Générez vos factures en un clic à la fin de la séance. Suivez votre chiffre d'affaires en temps réel.</p>
                            <Button variant="outline" className="rounded-full px-6">En savoir plus</Button>
                         </div>
                         {/* Image Integration - Billing */}
                         <div className="flex-1 w-full h-[300px] bg-white rounded-xl shadow-sm border overflow-hidden relative">
                              <Image 
                                src="/images/interface/Gemini_Generated_Image_wug50awug50awug5 (3).jpeg" 
                                alt="Billing Interface" 
                                fill 
                                className="object-cover object-left-top" 
                            />
                         </div>
                     </div>
                </div>
            </div>
        </section>

        {/* Testimonials */}
        <section id="testimonials" className="py-24 bg-[#F3F6FC]">
             <div className="container mx-auto px-6">
                <div className="text-center mb-16">
                    <h2 className="text-3xl font-bold text-slate-900 mb-4">Ils ont adopté TheraFlow</h2>
                </div>
                <div className="grid md:grid-cols-3 gap-8">
                    {[
                        { name: "Sophie Martin", role: "Ostéopathe", text: "Un gain de temps incroyable. Je peux enfin me concentrer sur mes soins.", img: "/images/landing-page/Gemini_Generated_Image_17pxe817pxe817px (3).jpeg" },
                        { name: "Marc Durand", role: "Naturopathe", text: "L'interface est tellement intuitive. Mes patients adorent la réservation en ligne.", img: "/images/landing-page/Gemini_Generated_Image_17pxe817pxe817px (4).jpeg" },
                        { name: "Julie Petit", role: "Sophrologue", text: "Le support est ultra réactif. Une équipe à l'écoute des praticiens.", img: "/images/landing-page/Gemini_Generated_Image_17pxe817pxe817px.jpeg" }
                    ].map((t, i) => (
                        <div key={i} className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
                            <div className="flex gap-1 text-yellow-400 mb-4">
                                <Star className="h-4 w-4 fill-current" /><Star className="h-4 w-4 fill-current" /><Star className="h-4 w-4 fill-current" /><Star className="h-4 w-4 fill-current" /><Star className="h-4 w-4 fill-current" />
                            </div>
                            <p className="text-slate-600 italic mb-6">"{t.text}"</p>
                            <div className="flex items-center gap-4">
                                <div className="h-12 w-12 rounded-full overflow-hidden relative bg-slate-200">
                                    <Image src={t.img} alt={t.name} fill className="object-cover" />
                                </div>
                                <div>
                                    <p className="font-bold text-slate-900">{t.name}</p>
                                    <p className="text-sm text-slate-500">{t.role}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
             </div>
        </section>

        {/* Footer */}
        <footer className="bg-slate-900 text-slate-400 py-16">
             <div className="container mx-auto px-6 grid md:grid-cols-4 gap-12">
                 <div className="col-span-2">
                     <span className="text-2xl font-bold text-white block mb-6">TheraFlow</span>
                     <p className="max-w-sm">La solution de gestion moderne pour les praticiens de santé bien-être.</p>
                 </div>
                 <div>
                     <h4 className="text-white font-bold mb-6">Produit</h4>
                     <ul className="space-y-4">
                         <li><Link href="#" className="hover:text-white">Fonctionnalités</Link></li>
                         <li><Link href="#" className="hover:text-white">Tarifs</Link></li>
                         <li><Link href="#" className="hover:text-white">Témoignages</Link></li>
                     </ul>
                 </div>
                 <div>
                     <h4 className="text-white font-bold mb-6">Légal</h4>
                     <ul className="space-y-4">
                         <li><Link href="#" className="hover:text-white">Mentions Légales</Link></li>
                         <li><Link href="#" className="hover:text-white">Confidentialité</Link></li>
                         <li><Link href="#" className="hover:text-white">CGV</Link></li>
                     </ul>
                 </div>
             </div>
             <div className="container mx-auto px-6 pt-8 mt-12 border-t border-slate-800 text-center text-sm">
                 &copy; 2025 TheraFlow. Tous droits réservés.
             </div>
        </footer>

      </main>
    </div>
  );
}
