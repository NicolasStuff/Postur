import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Star, Menu, Calendar, Users, ChevronRight, ArrowRight, Shield, Zap } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background font-sans text-foreground selection:bg-primary/20 selection:text-primary overflow-x-hidden">
      
      {/* Background Gradients */}
      <div className="fixed inset-0 z-[-1] pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[100vw] h-[100vh] bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(120,119,198,0.15),rgba(255,255,255,0))]"></div>
          <div className="absolute top-0 left-0 w-full h-full bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay"></div>
      </div>

      {/* Navbar */}
      <nav className="sticky top-0 z-50 w-full border-b border-white/10 bg-white/70 backdrop-blur-xl supports-[backdrop-filter]:bg-white/40">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
             <div className="h-8 w-8 bg-gradient-to-br from-primary to-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20">
                <div className="h-3 w-3 bg-white rounded-full"></div>
             </div>
             <span className="text-lg font-bold tracking-tight">TheraFlow</span>
          </div>

          {/* Desktop Links */}
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
            <Link href="#features" className="hover:text-foreground transition-colors">Fonctionnalités</Link>
            <Link href="#testimonials" className="hover:text-foreground transition-colors">Témoignages</Link>
            <Link href="#pricing" className="hover:text-foreground transition-colors">Tarifs</Link>
          </div>

          {/* Actions */}
          <div className="hidden md:flex items-center gap-4">
            <Link href="/signin" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Se connecter</Link>
            <Link href="/signin">
                <Button className="bg-primary hover:bg-primary/90 text-white rounded-full px-6 h-9 text-sm font-medium shadow-[0_0_20px_-5px_var(--primary)] transition-all hover:shadow-[0_0_25px_-5px_var(--primary)] hover:scale-105">
                    Essayer gratuitement
                </Button>
            </Link>
          </div>

           {/* Mobile Menu */}
           <div className="md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon"><Menu className="h-5 w-5" /></Button>
              </SheetTrigger>
              <SheetContent>
                 <div className="flex flex-col gap-6 mt-8">
                    <Link href="#features" className="text-lg font-medium">Fonctionnalités</Link>
                    <Link href="#testimonials" className="text-lg font-medium">Témoignages</Link>
                    <Link href="#pricing" className="text-lg font-medium">Tarifs</Link>
                    <hr className="border-border" />
                    <Link href="/signin"><Button variant="ghost" className="w-full justify-start">Se connecter</Button></Link>
                    <Link href="/signin"><Button className="w-full rounded-full">Essayer gratuitement</Button></Link>
                 </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </nav>

      <main>
        {/* Hero Section */}
        <section className="pt-24 pb-32 relative overflow-hidden">
          <div className="container mx-auto px-6 relative z-10">
            <div className="flex flex-col items-center text-center max-w-4xl mx-auto mb-16">
                
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/50 border border-white/20 shadow-sm backdrop-blur-md text-xs font-medium text-muted-foreground mb-8 hover:bg-white/80 transition-colors cursor-default">
                        <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
                        Nouvelle version disponible
                        <ChevronRight className="h-3 w-3 opacity-50" />
                    </div>
                </div>

                <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-foreground mb-6 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-100">
                  Le cabinet du futur, <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-blue-500 to-purple-600 animate-gradient-x">aujourd&apos;hui.</span>
                </h1>
                
                <p className="text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto mb-10 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200">
                  La solution tout-en-un pour les praticiens de santé. <br className="hidden sm:block" />
                  Gérez vos patients, votre agenda et votre facturation sans effort.
                </p>
                
                <div className="flex flex-col sm:flex-row items-center gap-4 justify-center animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300">
                    <Link href="/signin">
                        <Button className="h-12 px-8 text-base rounded-full bg-foreground text-background hover:bg-foreground/90 shadow-xl shadow-foreground/10 transition-all hover:scale-105">
                            Commencer maintenant <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    </Link>
                    <Link href="#features">
                        <Button variant="ghost" className="h-12 px-8 text-base rounded-full hover:bg-white/50">
                            Voir la démo
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Hero Visual */}
            <div className="relative max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-500">
                 <div className="relative rounded-2xl border border-white/20 bg-white/30 backdrop-blur-xl shadow-2xl shadow-blue-900/10 p-2 ring-1 ring-black/5">
                    <div className="relative aspect-[16/10] rounded-xl overflow-hidden bg-white border border-white/50">
                        <Image 
                            src="/images/interface/Gemini_Generated_Image_wug50awug50awug5 (2).jpeg" 
                            alt="TheraFlow Dashboard"
                            fill
                            className="object-cover"
                            priority
                        />
                        {/* Overlay Gradient */}
                        <div className="absolute inset-0 bg-gradient-to-t from-white/20 to-transparent pointer-events-none"></div>
                    </div>
                 </div>
                 
                 {/* Floating Elements */}
                 <div className="absolute -right-4 top-1/4 p-4 bg-white/80 backdrop-blur-md rounded-2xl border border-white/50 shadow-xl animate-bounce-slow hidden md:block">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                            <CheckCircle2 className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-foreground">Facture envoyée</p>
                            <p className="text-xs text-muted-foreground">À l&apos;instant</p>
                        </div>
                    </div>
                 </div>

                 <div className="absolute -left-8 bottom-1/4 p-4 bg-white/80 backdrop-blur-md rounded-2xl border border-white/50 shadow-xl animate-bounce-slow delay-700 hidden md:block">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <Calendar className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-foreground">Prochain RDV</p>
                            <p className="text-xs text-muted-foreground">Dans 15 min</p>
                        </div>
                    </div>
                 </div>
            </div>
          </div>
        </section>
        
        {/* Social Proof */}
        <section className="py-12 border-y border-border/50 bg-white/30 backdrop-blur-sm">
            <div className="container mx-auto px-6">
                <p className="text-center text-sm font-semibold text-muted-foreground uppercase tracking-widest mb-8">Ils nous font confiance</p>
                <div className="flex flex-wrap justify-center items-center gap-12 md:gap-24 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
                     {/* Mock Logos */}
                     <div className="flex items-center gap-2 font-bold text-xl text-foreground"><div className="h-6 w-6 bg-foreground rounded-full"></div>OsteoPlus</div>
                     <div className="flex items-center gap-2 font-bold text-xl text-foreground"><div className="h-6 w-6 bg-foreground rounded-tr-xl"></div>SanteNaturo</div>
                     <div className="flex items-center gap-2 font-bold text-xl text-foreground"><div className="h-6 w-6 bg-foreground rounded-sm rotate-45"></div>ZenSophro</div>
                     <div className="flex items-center gap-2 font-bold text-xl text-foreground"><div className="h-6 w-6 bg-foreground rounded-full border-4 border-white ring-1 ring-foreground"></div>MedLink</div>
                </div>
            </div>
        </section>

        {/* Features Grid (Bento) */}
        <section id="features" className="py-32 relative">
            <div className="container mx-auto px-6">
                <div className="text-center max-w-3xl mx-auto mb-20">
                    <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-6 tracking-tight">Tout pour votre réussite</h2>
                    <p className="text-xl text-muted-foreground">Une suite d&apos;outils puissants conçus pour simplifier votre quotidien.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[minmax(300px,auto)]">
                     
                     {/* Feature 1: Agenda (Large) */}
                     <div className="md:col-span-2 row-span-1 bg-white rounded-3xl p-8 border border-border shadow-sm hover:shadow-xl transition-all duration-500 group overflow-hidden relative">
                        <div className="relative z-10">
                            <div className="h-12 w-12 bg-blue-50 rounded-xl flex items-center justify-center mb-6 text-primary group-hover:scale-110 transition-transform duration-500">
                                <Calendar className="h-6 w-6" />
                            </div>
                            <h3 className="text-2xl font-bold text-foreground mb-3">Agenda Intelligent</h3>
                            <p className="text-muted-foreground max-w-md">Synchronisation automatique, rappels SMS et prise de rendez-vous en ligne. Ne manquez plus aucun patient.</p>
                        </div>
                        <div className="absolute right-0 bottom-0 w-3/5 h-4/5 bg-slate-50 rounded-tl-3xl border-t border-l border-border overflow-hidden shadow-inner translate-y-4 translate-x-4 group-hover:translate-y-2 group-hover:translate-x-2 transition-transform duration-500">
                             <Image 
                                src="/images/interface/Gemini_Generated_Image_hdxo9ghdxo9ghdxo.jpeg" 
                                alt="Agenda Interface" 
                                fill 
                                className="object-cover object-top" 
                            />
                        </div>
                     </div>

                     {/* Feature 2: Security (Small) */}
                     <div className="bg-white rounded-3xl p-8 border border-border shadow-sm hover:shadow-xl transition-all duration-500 group flex flex-col justify-between">
                        <div>
                            <div className="h-12 w-12 bg-green-50 rounded-xl flex items-center justify-center mb-6 text-green-600 group-hover:scale-110 transition-transform duration-500">
                                <Shield className="h-6 w-6" />
                            </div>
                            <h3 className="text-xl font-bold text-foreground mb-3">Données Sécurisées</h3>
                            <p className="text-muted-foreground text-sm">Hébergement HDS (Données de Santé). Vos dossiers patients sont chiffrés et protégés.</p>
                        </div>
                        <div className="mt-6 flex items-center gap-2 text-xs font-medium text-green-600 bg-green-50 w-fit px-3 py-1 rounded-full">
                            <CheckCircle2 className="h-3 w-3" /> Conforme RGPD
                        </div>
                     </div>

                     {/* Feature 3: Patient Files (Tall) */}
                     <div className="row-span-2 bg-white rounded-3xl p-8 border border-border shadow-sm hover:shadow-xl transition-all duration-500 group overflow-hidden relative flex flex-col">
                        <div className="relative z-10 mb-8">
                            <div className="h-12 w-12 bg-purple-50 rounded-xl flex items-center justify-center mb-6 text-purple-600 group-hover:scale-110 transition-transform duration-500">
                                <Users className="h-6 w-6" />
                            </div>
                            <h3 className="text-2xl font-bold text-foreground mb-3">Dossiers Patients</h3>
                            <p className="text-muted-foreground">Notes de consultation, antécédents, et schémas corporels interactifs.</p>
                        </div>
                        <div className="flex-1 relative min-h-[200px] bg-slate-50 rounded-t-2xl border-t border-x border-border overflow-hidden shadow-sm mx-auto w-full">
                             <Image 
                                src="/images/interface/Gemini_Generated_Image_wug50awug50awug5 (2).jpeg" 
                                alt="Patient File Interface" 
                                fill 
                                className="object-cover object-top" 
                            />
                        </div>
                     </div>

                     {/* Feature 4: Billing (Medium) */}
                     <div className="md:col-span-2 bg-white rounded-3xl p-8 border border-border shadow-sm hover:shadow-xl transition-all duration-500 group flex flex-col md:flex-row items-center gap-8 overflow-hidden">
                         <div className="flex-1">
                            <div className="h-12 w-12 bg-orange-50 rounded-xl flex items-center justify-center mb-6 text-orange-600 group-hover:scale-110 transition-transform duration-500">
                                <Zap className="h-6 w-6" />
                            </div>
                            <h3 className="text-2xl font-bold text-foreground mb-3">Facturation Éclair</h3>
                            <p className="text-muted-foreground mb-6">Générez et envoyez vos factures en un clic. Suivi des paiements et export comptable automatisé.</p>
                            <Button variant="outline" className="rounded-full group-hover:bg-orange-50 group-hover:text-orange-700 group-hover:border-orange-200 transition-colors">En savoir plus</Button>
                         </div>
                         <div className="flex-1 w-full h-[200px] relative bg-slate-50 rounded-xl border border-border overflow-hidden shadow-sm">
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
        <section id="testimonials" className="py-24 bg-secondary/30 border-y border-border/50">
             <div className="container mx-auto px-6">
                <div className="text-center mb-16">
                    <h2 className="text-3xl font-bold text-foreground mb-4">Ils ont adopté TheraFlow</h2>
                    <p className="text-muted-foreground">Rejoignez plus de 2000 praticiens satisfaits.</p>
                </div>
                <div className="grid md:grid-cols-3 gap-8">
                    {[
                        { name: "Sophie Martin", role: "Ostéopathe", text: "Un gain de temps incroyable. Je peux enfin me concentrer sur mes soins.", img: "/images/landing-page/Gemini_Generated_Image_17pxe817pxe817px (3).jpeg" },
                        { name: "Marc Durand", role: "Naturopathe", text: "L'interface est tellement intuitive. Mes patients adorent la réservation en ligne.", img: "/images/landing-page/Gemini_Generated_Image_17pxe817pxe817px (4).jpeg" },
                        { name: "Julie Petit", role: "Sophrologue", text: "Le support est ultra réactif. Une équipe à l'écoute des praticiens.", img: "/images/landing-page/Gemini_Generated_Image_17pxe817pxe817px.jpeg" }
                    ].map((t, i) => (
                        <div key={i} className="bg-white p-8 rounded-2xl shadow-sm border border-border hover:shadow-lg transition-all duration-300">
                            <div className="flex gap-1 text-yellow-400 mb-4">
                                <Star className="h-4 w-4 fill-current" /><Star className="h-4 w-4 fill-current" /><Star className="h-4 w-4 fill-current" /><Star className="h-4 w-4 fill-current" /><Star className="h-4 w-4 fill-current" />
                            </div>
                            <p className="text-muted-foreground italic mb-6 leading-relaxed">&quot;{t.text}&quot;</p>
                            <div className="flex items-center gap-4">
                                <div className="h-12 w-12 rounded-full overflow-hidden relative bg-secondary ring-2 ring-white shadow-md">
                                    <Image src={t.img} alt={t.name} fill className="object-cover" />
                                </div>
                                <div>
                                    <p className="font-bold text-foreground">{t.name}</p>
                                    <p className="text-sm text-muted-foreground">{t.role}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
             </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 relative overflow-hidden">
            <div className="container mx-auto px-6 relative z-10">
                <div className="bg-foreground rounded-[2.5rem] p-12 md:p-24 text-center relative overflow-hidden shadow-2xl">
                    {/* Background Pattern */}
                    <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]"></div>
                    
                    <div className="relative z-10 max-w-2xl mx-auto">
                        <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">Prêt à transformer votre cabinet ?</h2>
                        <p className="text-lg text-slate-300 mb-10">Essayez TheraFlow gratuitement pendant 14 jours. Sans engagement, sans carte bancaire.</p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <Link href="/signin">
                                <Button className="h-14 px-8 text-lg rounded-full bg-white text-foreground hover:bg-slate-100 shadow-xl transition-transform hover:scale-105">
                                    Commencer l&apos;essai gratuit
                                </Button>
                            </Link>
                        </div>
                        <p className="mt-6 text-sm text-slate-500">Pas de carte bancaire requise.</p>
                    </div>
                </div>
            </div>
        </section>

        {/* Footer */}
        <footer className="bg-white border-t border-border py-16">
             <div className="container mx-auto px-6 grid md:grid-cols-4 gap-12">
                 <div className="col-span-2">
                     <div className="flex items-center gap-2 mb-6">
                        <div className="h-6 w-6 bg-gradient-to-br from-primary to-blue-600 rounded-md flex items-center justify-center">
                            <div className="h-2 w-2 bg-white rounded-full"></div>
                        </div>
                        <span className="text-lg font-bold tracking-tight text-foreground">TheraFlow</span>
                     </div>
                     <p className="max-w-sm text-muted-foreground">La solution de gestion moderne pour les praticiens de santé bien-être. Simplifiez votre quotidien.</p>
                 </div>
                 <div>
                     <h4 className="font-bold text-foreground mb-6">Produit</h4>
                     <ul className="space-y-4 text-sm text-muted-foreground">
                         <li><Link href="#" className="hover:text-primary transition-colors">Fonctionnalités</Link></li>
                         <li><Link href="#" className="hover:text-primary transition-colors">Tarifs</Link></li>
                         <li><Link href="#" className="hover:text-primary transition-colors">Témoignages</Link></li>
                         <li><Link href="#" className="hover:text-primary transition-colors">Roadmap</Link></li>
                     </ul>
                 </div>
                 <div>
                     <h4 className="font-bold text-foreground mb-6">Légal</h4>
                     <ul className="space-y-4 text-sm text-muted-foreground">
                         <li><Link href="#" className="hover:text-primary transition-colors">Mentions Légales</Link></li>
                         <li><Link href="#" className="hover:text-primary transition-colors">Confidentialité</Link></li>
                         <li><Link href="#" className="hover:text-primary transition-colors">CGV</Link></li>
                         <li><Link href="#" className="hover:text-primary transition-colors">Contact</Link></li>
                     </ul>
                 </div>
             </div>
             <div className="container mx-auto px-6 pt-8 mt-12 border-t border-border text-center text-sm text-muted-foreground">
                 &copy; 2025 TheraFlow. Tous droits réservés.
             </div>
        </footer>

      </main>
    </div>
  );
}
