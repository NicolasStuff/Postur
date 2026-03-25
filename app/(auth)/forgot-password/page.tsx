"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { ArrowLeft, Loader2, Mail } from "lucide-react"
import { authClient } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async () => {
    if (!email.trim()) return
    setIsLoading(true)
    setError("")

    const { error: _error } = await authClient.requestPasswordReset({
      email,
      redirectTo: "/reset-password",
    })

    setIsLoading(false)
    setSent(true) // Always show success to avoid revealing if email exists
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-white p-6">
      <div className="w-full max-w-md space-y-8">
        <div className="flex justify-center">
          <Link href="/">
            <Image src="/images/logo/logo.svg" alt="Postur" width={40} height={40} />
          </Link>
        </div>

        {sent ? (
          <div className="space-y-4 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
              <Mail className="h-5 w-5 text-emerald-600" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Vérifiez votre boîte mail
            </h1>
            <p className="text-sm text-slate-500">
              Si un compte existe avec cet email, vous recevrez un lien de réinitialisation.
            </p>
            <Button variant="outline" asChild className="mt-4">
              <Link href="/signin?tab=signin">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Retour à la connexion
              </Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="space-y-2 text-center">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                Mot de passe oublié
              </h1>
              <p className="text-sm text-slate-500">
                Entrez votre email pour recevoir un lien de réinitialisation.
              </p>
            </div>

            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-600">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-700">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="docteur@exemple.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                  className="h-12 rounded-lg"
                />
              </div>
              <Button
                className="w-full h-12 rounded-lg bg-slate-900 hover:bg-slate-800"
                onClick={handleSubmit}
                disabled={isLoading || !email.trim()}
              >
                {isLoading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                Envoyer le lien
              </Button>
            </div>

            <div className="text-center">
              <Link
                href="/signin?tab=signin"
                className="text-sm text-slate-500 hover:text-slate-900"
              >
                <ArrowLeft className="mr-1 inline h-3.5 w-3.5" />
                Retour à la connexion
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
