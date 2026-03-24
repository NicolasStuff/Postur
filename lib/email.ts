import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

const EMAIL_FROM = process.env.EMAIL_FROM || "Postur <facturation@postur.fr>"

interface SendInvoiceEmailParams {
  to: string
  invoiceNumber: string
  patientName: string
  issuerName: string
  pdfBuffer: Buffer
}

export async function sendInvoiceEmail({
  to,
  invoiceNumber,
  patientName,
  issuerName,
  pdfBuffer,
}: SendInvoiceEmailParams) {
  const { error } = await resend.emails.send({
    from: EMAIL_FROM,
    to,
    subject: `Facture ${invoiceNumber} - ${issuerName}`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 520px; margin: 0 auto; padding: 32px 0;">
        <p style="color: #1e293b; font-size: 15px; line-height: 1.6; margin: 0 0 16px;">
          Bonjour ${patientName},
        </p>
        <p style="color: #475569; font-size: 15px; line-height: 1.6; margin: 0 0 24px;">
          Veuillez trouver ci-joint votre facture <strong>${invoiceNumber}</strong>.
        </p>
        <p style="color: #94a3b8; font-size: 13px; line-height: 1.5; margin: 0; border-top: 1px solid #e2e8f0; padding-top: 16px;">
          ${issuerName}
        </p>
      </div>
    `,
    attachments: [
      {
        filename: `${invoiceNumber}.pdf`,
        content: pdfBuffer,
      },
    ],
  })

  if (error) {
    throw new Error(error.message)
  }
}
