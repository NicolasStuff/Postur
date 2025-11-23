"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Lightbulb, ExternalLink, CheckCircle2, Copy } from "lucide-react"
import { toast } from "sonner"

export function GoogleBookingTutorial() {
  const [open, setOpen] = useState(false)
  const bookingLink = "https://osteoflow.fr/p/votre-nom" // This will be dynamic based on user

  const copyBookingLink = () => {
    navigator.clipboard.writeText(bookingLink)
    toast.success("Lien copié dans le presse-papier !")
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200 p-4 cursor-pointer hover:shadow-md transition-shadow">
          <div className="flex items-start gap-3">
            <div className="bg-blue-500 rounded-full p-2 mt-1">
              <Lightbulb className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-blue-900 mb-1">
                Augmentez vos réservations de 40% !
              </h3>
              <p className="text-sm text-blue-700 mb-3">
                Ajoutez votre lien de réservation directement sur votre fiche Google Business.
                Vos patients pourront prendre rendez-vous en un clic depuis Google.
              </p>
              <Button
                variant="default"
                size="sm"
                className="bg-blue-600 hover:bg-blue-700"
              >
                Voir le tutoriel (2 min)
              </Button>
            </div>
          </div>
        </Card>
      </DialogTrigger>

      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <Lightbulb className="h-6 w-6 text-blue-600" />
            Boostez vos réservations avec Google Business
          </DialogTitle>
          <DialogDescription>
            Ajoutez un bouton &quot;Prendre rendez-vous&quot; directement sur votre fiche Google.
            Simple, rapide et efficace pour convertir vos visiteurs en patients.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Step 1 */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold">
                1
              </div>
              <h3 className="font-semibold text-lg">Se trouver sur Google</h3>
            </div>
            <p className="text-sm text-muted-foreground ml-10">
              Connectez-vous à votre compte Gmail professionnel, puis tapez le nom de votre cabinet dans Google.
              Vous verrez apparaître votre tableau de bord de gestion directement dans les résultats de recherche.
            </p>
            {/* Screenshot placeholder 1 */}
            <div className="ml-10 bg-slate-100 border-2 border-dashed border-slate-300 rounded-lg p-12 flex flex-col items-center justify-center">
              <div className="text-slate-400 text-sm font-medium mb-2">
                📸 Screenshot 1 - À ajouter
              </div>
              <p className="text-xs text-slate-500 text-center">
                Recherche Google montrant la fiche du cabinet
              </p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold">
                2
              </div>
              <h3 className="font-semibold text-lg">Cliquer sur &quot;Éditer la fiche&quot;</h3>
            </div>
            <p className="text-sm text-muted-foreground ml-10">
              Une fois sur votre fiche, cliquez sur le bouton pour modifier vos informations.
            </p>
            {/* Screenshot placeholder 2 */}
            <div className="ml-10 bg-slate-100 border-2 border-dashed border-slate-300 rounded-lg p-12 flex flex-col items-center justify-center">
              <div className="text-slate-400 text-sm font-medium mb-2">
                📸 Screenshot 2 - À ajouter
              </div>
              <p className="text-xs text-slate-500 text-center">
                Bouton &quot;Éditer la fiche&quot; dans Google Business
              </p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold">
                3
              </div>
              <h3 className="font-semibold text-lg">Trouver le champ &quot;Rendez-vous&quot;</h3>
            </div>
            <p className="text-sm text-muted-foreground ml-10">
              Google propose un champ spécifique (distinct du site web) appelé &quot;Liens pour prendre rendez-vous&quot;
              ou &quot;Appointment links&quot;. C&apos;est là que vous allez ajouter votre lien.
            </p>
            {/* Screenshot placeholder 3 */}
            <div className="ml-10 bg-slate-100 border-2 border-dashed border-slate-300 rounded-lg p-12 flex flex-col items-center justify-center">
              <div className="text-slate-400 text-sm font-medium mb-2">
                📸 Screenshot 3 - À ajouter
              </div>
              <p className="text-xs text-slate-500 text-center">
                Champ &quot;Liens pour prendre rendez-vous&quot; dans l&apos;interface
              </p>
            </div>
          </div>

          {/* Step 4 */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold">
                4
              </div>
              <h3 className="font-semibold text-lg">Coller votre lien OsteoFlow</h3>
            </div>
            <p className="text-sm text-muted-foreground ml-10 mb-3">
              Copiez et collez simplement votre lien personnel OsteoFlow.
              Dès que vous validez, le bouton bleu &quot;Prendre rendez-vous&quot; apparaîtra sur votre fiche publique.
            </p>

            {/* Booking link card */}
            <div className="ml-10 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-xs text-blue-700 font-medium mb-1">
                    Votre lien de réservation :
                  </p>
                  <code className="text-sm text-blue-900 font-mono">
                    {bookingLink}
                  </code>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={copyBookingLink}
                  className="ml-3"
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copier
                </Button>
              </div>
            </div>
          </div>

          {/* Success message */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-green-900 mb-1">
                C&apos;est instantané !
              </p>
              <p className="text-sm text-green-700">
                Une fois le lien ajouté, vos patients verront immédiatement le bouton
                &quot;Prendre rendez-vous&quot; sur votre fiche Google. Plus besoin d&apos;appeler,
                ils réservent directement en ligne !
              </p>
            </div>
          </div>

          {/* CTA Footer */}
          <div className="pt-4 border-t">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">
                  Besoin d&apos;aide ?
                </p>
                <p className="text-xs text-muted-foreground">
                  Notre équipe est là pour vous accompagner
                </p>
              </div>
              <Button variant="outline" size="sm">
                <ExternalLink className="h-4 w-4 mr-2" />
                Centre d&apos;aide
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
