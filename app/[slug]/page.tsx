import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { MapPin, Phone } from "lucide-react"
import { getPractitionerBySlug } from "@/app/actions/booking"
import { BookingFlow } from "@/components/booking/BookingFlow"
import { notFound } from "next/navigation"

export default async function PublicBookingPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const practitioner = await getPractitionerBySlug(slug)

  if (!practitioner) {
    return notFound()
  }

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4">
      <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-8">
        {/* Left: Practitioner Context */}
        <div className="md:col-span-1 space-y-6">
            <Card>
                <CardHeader className="flex flex-col items-center text-center">
                    <Avatar className="w-24 h-24 mb-4">
                        <AvatarImage src={practitioner.image || ""} />
                        <AvatarFallback>{practitioner.name?.[0] || "DR"}</AvatarFallback>
                    </Avatar>
                    <CardTitle>{practitioner.name}</CardTitle>
                    <CardDescription>{practitioner.practitionerType}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                    {practitioner.companyAddress && (
                        <div className="flex items-center gap-3 text-muted-foreground">
                            <MapPin className="h-4 w-4" />
                            <span>{practitioner.companyAddress}</span>
                        </div>
                    )}
                     <div className="flex items-center gap-3 text-muted-foreground">
                        <Phone className="h-4 w-4" />
                        <span>Contact details hidden</span>
                    </div>
                </CardContent>
            </Card>
        </div>

        {/* Right: Booking Flow */}
        <div className="md:col-span-2">
            <BookingFlow practitioner={practitioner} slug={slug} />
        </div>
      </div>
    </div>
  )
}
