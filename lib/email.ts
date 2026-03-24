import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

const EMAIL_FROM = process.env.EMAIL_FROM || "Postur <facturation@postur.fr>"

interface SendInvoiceEmailParams {
  to: string
  invoiceNumber: string
  invoiceDate: string
  totalAmount: string
  patientName: string
  issuerName: string
  issuerAddress: string | null
  issuerSiret: string | null
  pdfBuffer: Buffer
}

export async function sendInvoiceEmail({
  to,
  invoiceNumber,
  invoiceDate,
  totalAmount,
  patientName,
  issuerName,
  issuerAddress,
  issuerSiret,
  pdfBuffer,
}: SendInvoiceEmailParams) {
  const footerParts = [
    issuerAddress
      ? `<p style="margin:0 0 2px;font-size:12px;color:#94a3b8;line-height:1.5;">${issuerAddress}</p>`
      : "",
    issuerSiret
      ? `<p style="margin:0;font-size:12px;color:#94a3b8;">SIRET\u00a0: ${issuerSiret}</p>`
      : "",
  ]
    .filter(Boolean)
    .join("")

  const { error } = await resend.emails.send({
    from: EMAIL_FROM,
    to,
    subject: `Facture ${invoiceNumber} - ${issuerName}`,
    html: `
      <div style="background-color:#f1f5f9;padding:32px 0;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;background-color:#ffffff;border-radius:12px;overflow:hidden;border-collapse:collapse;">
          <tr>
            <td style="height:4px;background-color:#2563eb;font-size:0;line-height:0;">&nbsp;</td>
          </tr>
          <tr>
            <td style="padding:32px 36px 12px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
              <p style="margin:0 0 24px;font-size:18px;font-weight:700;color:#0f172a;letter-spacing:-0.025em;">Postur</p>
              <p style="margin:0 0 8px;font-size:15px;color:#0f172a;line-height:1.6;">Bonjour ${patientName},</p>
              <p style="margin:0 0 24px;font-size:15px;color:#475569;line-height:1.6;">Veuillez trouver ci-joint votre facture.</p>
            </td>
          </tr>
          <tr>
            <td style="padding:0 36px 24px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;border-collapse:collapse;">
                <tr>
                  <td style="padding:16px 20px 12px;font-size:13px;color:#64748b;">N° Facture</td>
                  <td style="padding:16px 20px 12px;font-size:14px;color:#0f172a;font-weight:600;text-align:right;">${invoiceNumber}</td>
                </tr>
                <tr>
                  <td colspan="2" style="padding:0 20px;"><div style="border-top:1px solid #e2e8f0;"></div></td>
                </tr>
                <tr>
                  <td style="padding:12px 20px;font-size:13px;color:#64748b;">Date</td>
                  <td style="padding:12px 20px;font-size:14px;color:#0f172a;text-align:right;">${invoiceDate}</td>
                </tr>
                <tr>
                  <td colspan="2" style="padding:0 20px;"><div style="border-top:1px solid #e2e8f0;"></div></td>
                </tr>
                <tr>
                  <td style="padding:12px 20px 16px;font-size:13px;color:#64748b;">Montant total</td>
                  <td style="padding:12px 20px 16px;font-size:18px;color:#0f172a;font-weight:700;text-align:right;">${totalAmount}</td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:0 36px 28px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
              <p style="margin:0;font-size:13px;color:#64748b;line-height:1.6;">&#128206; Votre facture est jointe à cet email au format PDF.</p>
            </td>
          </tr>
          <tr>
            <td style="padding:0 36px;"><div style="border-top:1px solid #e2e8f0;"></div></td>
          </tr>
          <tr>
            <td style="padding:20px 36px 28px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
              <p style="margin:0 0 2px;font-size:13px;color:#475569;font-weight:600;">${issuerName}</p>
              ${footerParts}
              <p style="margin:12px 0 0;font-size:11px;color:#cbd5e1;">Envoyé via Postur</p>
            </td>
          </tr>
        </table>
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

export async function sendResetPasswordEmail({
  to,
  url,
  name,
}: {
  to: string
  url: string
  name: string | null
}) {
  const { error } = await resend.emails.send({
    from: EMAIL_FROM,
    to,
    subject: "Réinitialisez votre mot de passe - Postur",
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 520px; margin: 0 auto; padding: 32px 0;">
        <p style="color: #1e293b; font-size: 15px; line-height: 1.6; margin: 0 0 16px;">
          Bonjour${name ? ` ${name}` : ""},
        </p>
        <p style="color: #475569; font-size: 15px; line-height: 1.6; margin: 0 0 24px;">
          Vous avez demandé à réinitialiser votre mot de passe. Cliquez sur le bouton ci-dessous pour en choisir un nouveau.
        </p>
        <a href="${url}" style="display: inline-block; background: #0f172a; color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-size: 14px; font-weight: 500;">
          Réinitialiser mon mot de passe
        </a>
        <p style="color: #94a3b8; font-size: 13px; line-height: 1.5; margin: 24px 0 0; border-top: 1px solid #e2e8f0; padding-top: 16px;">
          Si vous n'avez pas fait cette demande, ignorez cet email. Ce lien expire dans 1 heure.
        </p>
      </div>
    `,
  })

  if (error) {
    throw new Error(error.message)
  }
}

export async function sendOtpEmail({
  to,
  otp,
}: {
  to: string
  otp: string
}) {
  const { error } = await resend.emails.send({
    from: EMAIL_FROM,
    to,
    subject: `${otp} — Code de vérification Postur`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 520px; margin: 0 auto; padding: 32px 0;">
        <p style="color: #1e293b; font-size: 15px; line-height: 1.6; margin: 0 0 16px;">
          Bienvenue sur Postur !
        </p>
        <p style="color: #475569; font-size: 15px; line-height: 1.6; margin: 0 0 24px;">
          Voici votre code de vérification :
        </p>
        <div style="background: #f1f5f9; border-radius: 12px; padding: 20px; text-align: center; margin: 0 0 24px;">
          <span style="font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #0f172a;">
            ${otp}
          </span>
        </div>
        <p style="color: #94a3b8; font-size: 13px; line-height: 1.5; margin: 0; border-top: 1px solid #e2e8f0; padding-top: 16px;">
          Ce code expire dans 10 minutes. Si vous n'avez pas créé de compte, ignorez cet email.
        </p>
      </div>
    `,
  })

  if (error) {
    throw new Error(error.message)
  }
}
