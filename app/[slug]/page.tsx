import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { MapPin, Phone, Clock, Award } from "lucide-react"
import { getPractitionerBySlug } from "@/app/actions/booking"
import { CalendlyStyleBooking } from "@/components/booking/CalendlyStyleBooking"
import { notFound } from "next/navigation"
import Image from "next/image"

export default async function PublicBookingPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const practitioner = await getPractitionerBySlug(slug)

  if (!practitioner) {
    return notFound()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Image
                src="/images/logo.svg"
                alt="Osteoflow"
                width={40}
                height={40}
                className="h-10 w-auto"
              />
              <span className="text-xl font-bold text-gray-900">Osteoflow</span>
            </div>
            <div className="text-sm text-gray-500">
              Réservation en ligne
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        <div className="grid lg:grid-cols-5 gap-8 lg:gap-12">
          {/* Left: Practitioner Info - Sticky on desktop */}
          <div className="lg:col-span-2">
            <div className="lg:sticky lg:top-24 space-y-6">
              {/* Practitioner Card */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-8">
                  <div className="flex flex-col items-center text-center mb-6">
                    <Avatar className="w-24 h-24 mb-4 ring-4 ring-blue-50">
                      <AvatarImage src={practitioner.image || ""} />
                      <AvatarFallback className="text-2xl bg-blue-100 text-blue-700">
                        {practitioner.name?.[0] || "DR"}
                      </AvatarFallback>
                    </Avatar>
                    <h1 className="text-2xl font-bold text-gray-900 mb-1">
                      {practitioner.name}
                    </h1>
                    <p className="text-blue-600 font-medium flex items-center gap-2">
                      <Award className="h-4 w-4" />
                      {practitioner.practitionerType}
                    </p>
                  </div>

                  <div className="space-y-4 border-t border-gray-100 pt-6">
                    {practitioner.companyAddress && (
                      <div className="flex items-start gap-3 text-gray-600">
                        <MapPin className="h-5 w-5 text-gray-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-gray-900 mb-1">Adresse</p>
                          <p className="text-sm">{practitioner.companyAddress}</p>
                        </div>
                      </div>
                    )}
                    <div className="flex items-start gap-3 text-gray-600">
                      <Phone className="h-5 w-5 text-gray-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-gray-900 mb-1">Contact</p>
                        <p className="text-sm">Disponible après réservation</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 text-gray-600">
                      <Clock className="h-5 w-5 text-gray-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-gray-900 mb-1">Durée</p>
                        <p className="text-sm">Variable selon la consultation</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Trust indicators */}
                <div className="bg-gray-50 px-8 py-6 border-t border-gray-100">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <svg className="h-5 w-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span>Professionnel vérifié</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <svg className="h-5 w-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span>Réservation instantanée</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <svg className="h-5 w-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span>Confirmation par email</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Security badge */}
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-50 rounded-lg p-2">
                    <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Paiement sécurisé</p>
                    <p className="text-xs text-gray-500">Vos données sont protégées</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Booking Flow */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 lg:p-8">
              <CalendlyStyleBooking practitioner={practitioner} slug={slug} />
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-sm text-gray-500">
            <p>Propulsé par <span className="font-semibold text-gray-900">Osteoflow</span></p>
            <p className="mt-2">Plateforme de gestion pour professionnels de santé</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
