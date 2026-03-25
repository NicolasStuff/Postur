"use client"

import { useState } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { authClient } from "@/lib/auth-client"
import { ManageCookiesButton } from "@/components/marketing/ManageCookiesButton"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { pushMarketingEvent } from "@/lib/marketing"
import { Loader2, Check, ArrowLeft } from "lucide-react"
export default function AuthPage() {
  const searchParams = useSearchParams()
  const defaultTab = searchParams.get('tab') === 'signin' ? 'signin' : 'signup'

  const [isLoading, setIsLoading] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [name, setName] = useState("")
  const [error, setError] = useState("")

  const handleSignIn = async () => {
    setIsLoading(true)
    setError("")
    await authClient.signIn.email({
      email,
      password,
    }, {
      onSuccess: () => {
        window.location.href = "/onboarding"
      },
      onError: (ctx) => {
        setError(ctx.error.message)
        setIsLoading(false)
      }
    })
  }

  const handleSignUp = async () => {
    setIsLoading(true)
    setError("")
    pushMarketingEvent("sign_up_started", {
      location: "auth_page",
      method: "email",
    })
    await authClient.signUp.email({
      email,
      password,
      name,
    }, {
      onSuccess: () => {
        window.location.href = "/onboarding?signup=success"
      },
      onError: (ctx) => {
        setError(ctx.error.message)
        setIsLoading(false)
      }
    })
  }

  const features = [
    "14 jours d'essai gratuit",
    "Aucune carte bancaire requise",
    "Accès à toutes les fonctionnalités",
    "Support prioritaire inclus",
    "Annulable à tout moment",
  ]

  return (
    <div className="min-h-screen bg-white flex">
      {/* Left side - Commercial / Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-slate-900 text-white flex-col justify-between p-12 relative overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-900/50 via-transparent to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-slate-950 to-transparent" />

        {/* Logo */}
        <div className="relative z-10">
          <Link href="/" className="flex items-center gap-2 group">
            <Image
              src="/images/logo/logo.svg"
              alt="Postur"
              width={40}
              height={40}
              className="h-10 w-auto"
            />
            <span className="text-xl font-bold tracking-tighter">POSTUR</span>
          </Link>
        </div>

        {/* Main content */}
        <div className="relative z-10 space-y-8">
          <div className="space-y-4">
            <h1 className="text-4xl lg:text-5xl font-bold tracking-tight leading-tight">
              Gérez votre cabinet<br />
              <span className="text-indigo-400">en toute simplicité.</span>
            </h1>
            <p className="text-lg text-slate-300 max-w-md">
              Rejoignez les ostéopathes qui ont choisi Postur pour simplifier leur quotidien.
            </p>
          </div>

          {/* Features list */}
          <ul className="space-y-4">
            {features.map((feature, i) => (
              <li key={i} className="flex items-center gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-500/20 flex items-center justify-center">
                  <Check className="w-4 h-4 text-indigo-400" />
                </div>
                <span className="text-slate-300">{feature}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Trust badges */}
        <div className="relative z-10">
          <div className="flex items-center gap-6 text-sm text-slate-400">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-400" />
              <span>Hébergé en France</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-400" />
              <span>Pensé pour le RGPD</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Auth form */}
      <div className="flex-1 flex flex-col">
        {/* Mobile header */}
        <div className="lg:hidden p-6 border-b border-slate-100">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/images/logo/logo.svg"
              alt="Postur"
              width={32}
              height={32}
              className="h-8 w-auto"
            />
            <span className="text-lg font-bold tracking-tighter text-slate-900">POSTUR</span>
          </Link>
        </div>

        {/* Form container */}
        <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
          <div className="w-full max-w-md space-y-8">
            {/* Back link - desktop only */}
            <Link
              href="/"
              className="hidden lg:inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Retour à l&apos;accueil
            </Link>

            {/* Header */}
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tight text-slate-900">
                Commencez gratuitement
              </h2>
              <p className="text-slate-500">
                Créez votre compte et démarrez votre essai de 14 jours.
              </p>
            </div>

            {/* Tabs */}
            <Tabs defaultValue={defaultTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6 bg-slate-100 p-1 rounded-lg">
                <TabsTrigger
                  value="signup"
                  className="rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm"
                >
                  Inscription
                </TabsTrigger>
                <TabsTrigger
                  value="signin"
                  className="rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm"
                >
                  Connexion
                </TabsTrigger>
              </TabsList>

              {/* Error message */}
              {error && (
                <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">
                  {error}
                </div>
              )}

              {/* Sign Up Form */}
              <TabsContent value="signup" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-slate-700">Nom complet</Label>
                  <Input
                    id="name"
                    placeholder="Dr. Jean Dupont"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="h-12 rounded-lg border-slate-200 focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email" className="text-slate-700">Email professionnel</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="docteur@exemple.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-12 rounded-lg border-slate-200 focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password" className="text-slate-700">Mot de passe</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-12 rounded-lg border-slate-200 focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>
                <Button
                  className="w-full h-12 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-base"
                  onClick={handleSignUp}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  ) : null}
                  Créer mon compte gratuit
                </Button>
                <p className="text-xs text-slate-500 text-center">
                  En créant un compte, vous acceptez nos{" "}
                  <Link href="/legal/terms" className="text-indigo-600 hover:underline">
                    Conditions d&apos;utilisation
                  </Link>{" "}
                  et notre{" "}
                  <Link href="/legal/privacy" className="text-indigo-600 hover:underline">
                    Politique de confidentialité
                  </Link>
                  .
                </p>
              </TabsContent>

              {/* Sign In Form */}
              <TabsContent value="signin" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-slate-700">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="docteur@exemple.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-12 rounded-lg border-slate-200 focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-slate-700">Mot de passe</Label>
                    <Link
                      href="/forgot-password"
                      className="text-sm text-indigo-600 hover:underline"
                    >
                      Mot de passe oublié ?
                    </Link>
                  </div>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-12 rounded-lg border-slate-200 focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>
                <Button
                  className="w-full h-12 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-medium text-base"
                  onClick={handleSignIn}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  ) : null}
                  Se connecter
                </Button>
              </TabsContent>
            </Tabs>

            {/* Mobile features - shown only on mobile */}
            <div className="lg:hidden pt-8 border-t border-slate-100">
              <p className="text-sm text-slate-500 text-center mb-4">
                Pourquoi choisir Postur ?
              </p>
              <div className="grid grid-cols-2 gap-3">
                {["14 jours gratuits", "Sans CB", "Toutes fonctionnalités", "Support inclus"].map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-slate-600">
                    <Check className="w-4 h-4 text-indigo-500" />
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-slate-100 pt-6 text-center text-xs text-slate-500">
              <div className="flex flex-wrap items-center justify-center gap-3">
                <Link href="/legal/privacy" className="hover:text-slate-900 hover:underline">
                  Confidentialité
                </Link>
                <Link href="/legal/cookies" className="hover:text-slate-900 hover:underline">
                  Cookies
                </Link>
                <Link href="/legal/terms" className="hover:text-slate-900 hover:underline">
                  CGU
                </Link>
                <Link href="/legal/mentions-legales" className="hover:text-slate-900 hover:underline">
                  Mentions légales
                </Link>
              </div>
              <div className="mt-3 flex justify-center">
                <ManageCookiesButton variant="link" className="h-auto px-0 text-xs text-slate-500" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
