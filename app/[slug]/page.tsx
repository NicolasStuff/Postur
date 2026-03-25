import { getPractitionerBySlug } from "@/app/actions/booking"
import { CalendlyStyleBooking } from "@/components/booking/CalendlyStyleBooking"
import { notFound } from "next/navigation"

export default async function PublicBookingPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const practitioner = await getPractitionerBySlug(slug)

  if (!practitioner) {
    return notFound()
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-4 py-8 md:py-12">
        <div className="w-full max-w-4xl">
          <CalendlyStyleBooking practitioner={practitioner} slug={slug} />
        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 text-center">
        <p className="text-sm text-gray-500">
          Propulsé par <a href="https://postur.fr" target="_blank" rel="noopener noreferrer" className="font-semibold text-gray-700 hover:text-blue-600 transition-colors">Postur</a>
        </p>
      </footer>
    </div>
  )
}
