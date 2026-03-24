import { headers } from "next/headers"
import { NextResponse } from "next/server"
import { type DocumentProps, renderToBuffer } from "@react-pdf/renderer"
import React from "react"

import { getInvoiceDetails } from "@/app/actions/billing"
import { auth } from "@/lib/auth"
import { recordAuditEventSafe } from "@/lib/audit"
import { InvoicePdfDocument } from "@/components/billing/InvoicePdfDocument"
import { prisma } from "@/lib/prisma"

function getLocaleFromHeaders(acceptLanguage: string | null): "fr" | "en" {
  if (!acceptLanguage) {
    return "fr"
  }

  return acceptLanguage.toLowerCase().startsWith("en") ? "en" : "fr"
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ invoiceId: string }> }
) {
  try {
    const { invoiceId } = await params
    const headersList = await headers()
    const locale = getLocaleFromHeaders(headersList.get("accept-language"))
    const session = await auth.api.getSession({ headers: headersList })
    const invoice = await getInvoiceDetails(invoiceId)
    const document = InvoicePdfDocument({ invoice, locale }) as React.ReactElement<DocumentProps>
    const buffer = await renderToBuffer(document)

    if (session?.user?.id) {
      await recordAuditEventSafe(prisma, {
        actorUserId: session.user.id,
        targetUserId: session.user.id,
        domain: "INVOICE",
        action: "INVOICE_PDF_EXPORTED",
        entityType: "Invoice",
        entityId: invoiceId,
        metadata: {
          invoiceNumber: invoice.number,
        },
      })
    }

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${invoice.number}.pdf"`,
        "Cache-Control": "private, no-store, max-age=0",
        Pragma: "no-cache",
        Expires: "0",
        "X-Content-Type-Options": "nosniff",
      },
    })
  } catch (error) {
    console.error("Failed to generate invoice PDF", error)
    return NextResponse.json({ error: "Unable to generate invoice PDF" }, { status: 500 })
  }
}
