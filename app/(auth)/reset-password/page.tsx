"use client"

import { useState } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { ArrowLeft, CheckCircle2, Loader2 } from "lucide-react"
import { authClient } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function ResetPasswordPage() {
  const searchParams = useSearchParams()
  const token = searchParams.get("token")

  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async () => {
    setError("")

    if (password.length < 8) {
      setError("Le mot de passe doit contenir au moins 8 caractères.")
      return
    }

    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas.")
      return
    }

    if (!token) {
      setError("Lien invalide ou expiré.")
      return
    }

    setIsLoading(true)

    await authClient.resetPassword(
      { newPassword: password, token },
      {
        onSuccess: () => {
          setIsLoading(false)
          setSuccess(true)
        },
        onError: (ctx) => {
          setError(ctx.error.message || "Le lien est invalide ou expiré.")
          setIsLoading(false)
        },
      }
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-white p-6">
      <div className="w-full max-w-md space-y-8">
        <div className="flex justify-center">
          <Link href="/">
            <Image src="/images/logo/logo.svg" alt="Postur" width={40} height={40} />
          </Link>
        </div>

        {success ? (
          <div className="space-y-4 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Mot de passe réinitialisé
            </h1>
            <p className="text-sm text-slate-500">
              Votre mot de passe a été mis à jour. Vous pouvez maintenant vous connecter.
            </p>
            <Button asChild className="mt-4 bg-slate-900 hover:bg-slate-800">
              <Link href="/signin?tab=signin">Se connecter</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="space-y-2 text-center">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                Nouveau mot de passe
              </h1>
              <p className="text-sm text-slate-500">
                Choisissez un nouveau mot de passe pour votre compte.
              </p>
            </div>

            {!token && (
              <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-600">
                Lien invalide ou expiré.{" "}
                <Link href="/forgot-password" className="underline font-medium">
                  Demander un nouveau lien
                </Link>
              </div>
            )}

            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-600">
                {error}
              </div>
            )}

            {token && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-slate-700">
                    Nouveau mot de passe
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-12 rounded-lg"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm" className="text-slate-700">
                    Confirmer le mot de passe
                  </Label>
                  <Input
                    id="confirm"
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                    className="h-12 rounded-lg"
                  />
                </div>
                <Button
                  className="w-full h-12 rounded-lg bg-slate-900 hover:bg-slate-800"
                  onClick={handleSubmit}
                  disabled={isLoading}
                >
                  {isLoading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                  Réinitialiser
                </Button>
              </div>
            )}

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
