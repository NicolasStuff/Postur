"use client"

import { useState } from "react"
import Image from "next/image"
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
import { useQuery } from "@tanstack/react-query"
import { getUserProfile } from "@/app/actions/user"

export function GoogleBookingTutorial() {
  const [open, setOpen] = useState(false)
  const { data: user } = useQuery({
    queryKey: ['userProfile'],
    queryFn: () => getUserProfile()
  })

  const bookingLink = user?.slug
    ? `https://postur.fr/${user.slug}`
    : "https://postur.fr/votre-nom"

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

      <DialogContent className="max-w-[90vw] sm:max-w-6xl max-h-[95vh] overflow-y-auto p-8">
        <DialogHeader>
          <DialogTitle className="text-3xl flex items-center gap-3">
            <Lightbulb className="h-8 w-8 text-blue-600" />
            Boostez vos réservations avec Google Business
          </DialogTitle>
          <DialogDescription className="text-base mt-3">
            Ajoutez un bouton &quot;Prendre rendez-vous&quot; directement sur votre fiche Google.
            Simple, rapide et efficace pour convertir vos visiteurs en patients.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-8 mt-6">
          {/* Step 1 */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 text-white rounded-full w-10 h-10 flex items-center justify-center font-bold text-lg">
                1
              </div>
              <h3 className="font-semibold text-xl">Se trouver sur Google</h3>
            </div>
            <p className="text-base text-muted-foreground">
              Connectez-vous à votre compte Gmail professionnel, puis tapez le nom de votre cabinet dans Google.
              Vous verrez apparaître votre tableau de bord de gestion directement dans les résultats de recherche.
            </p>
            {/* Screenshot 1 */}
            <div className="rounded-lg overflow-hidden border border-slate-300 shadow-sm">
              <Image
                src="/images/referencement/google-search.png"
                alt="Recherche Google montrant la fiche du cabinet"
                width={1200}
                height={800}
                className="w-full h-auto object-contain"
              />
            </div>
          </div>

          {/* Step 2 */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 text-white rounded-full w-10 h-10 flex items-center justify-center font-bold text-lg">
                2
              </div>
              <h3 className="font-semibold text-xl">Cliquer sur &quot;Réservations&quot; puis &quot;Ajouter un lien&quot;</h3>
            </div>
            <p className="text-base text-muted-foreground">
              Cliquez sur le bouton &quot;Réservations&quot; dans votre tableau de bord, puis sur &quot;Ajouter un autre lien&quot;.
              Google propose un champ spécifique appelé &quot;Liens vers vos outils de réservation en ligne&quot;.
            </p>
            {/* Screenshot 2 */}
            <div className="rounded-lg overflow-hidden border border-slate-300 shadow-sm">
              <Image
                src="/images/referencement/google-reservation.png"
                alt="Configuration de la réservation dans Google Business"
                width={1200}
                height={800}
                className="w-full h-auto object-contain"
              />
            </div>
          </div>

          {/* Step 3 */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 text-white rounded-full w-10 h-10 flex items-center justify-center font-bold text-lg">
                3
              </div>
              <h3 className="font-semibold text-xl">Coller votre lien Postur</h3>
            </div>
            <p className="text-base text-muted-foreground">
              Copiez et collez simplement votre lien personnel Postur dans le champ prévu à cet effet.
              Dès que vous validez, le bouton bleu &quot;Réserver en ligne&quot; apparaîtra sur votre fiche publique.
            </p>

            {/* Booking link card */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-5">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm text-blue-700 font-medium mb-2">
                    Votre lien de réservation :
                  </p>
                  <code className="text-base text-blue-900 font-mono">
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
          <div className="bg-green-50 border border-green-200 rounded-lg p-5 flex items-start gap-4">
            <CheckCircle2 className="h-6 w-6 text-green-600 mt-0.5" />
            <div>
              <p className="text-base font-semibold text-green-900 mb-2">
                C&apos;est instantané !
              </p>
              <p className="text-base text-green-700">
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
