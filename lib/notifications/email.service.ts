import { Resend } from "resend"

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null

const FROM_EMAIL =
  process.env.EMAIL_FROM || "Postur <notifications@postur.app>"

export { resend }

export interface EmailSendResult {
  providerMessageId: string | null
}

function wrapEmailContent(content: string): string {
  return `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Postur</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f8f9fa; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f8f9fa;">
        <tr>
          <td align="center" style="padding: 20px 0;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; background-color: #FFFFFF; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);">
              <tr>
                <td style="padding: 32px 40px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 16px; line-height: 1.6; color: #1a1a1a;">
                  ${content}
                </td>
              </tr>
              <tr>
                <td style="padding: 24px 40px; background-color: #f8f9fa; font-size: 12px; color: #6b7280; text-align: center;">
                  Cet email a ete envoye automatiquement. Merci de ne pas y repondre.
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `
}

interface BookingReminderEmailParams {
  to: string
  patientFirstName: string
  practitionerName: string
  serviceName: string
  date: string
  time: string
  duration: number
}

function buildReminderHtml(
  params: BookingReminderEmailParams,
  delayLabel: string,
): string {
  return wrapEmailContent(`
    <h2 style="font-size: 22px; font-weight: 600; margin: 0 0 20px 0; color: #1a1a1a;">
      Bonjour ${escapeHtml(params.patientFirstName)},
    </h2>
    <p style="margin: 0 0 16px 0;">
      Nous vous rappelons votre rendez-vous prevu <strong>${escapeHtml(delayLabel)}</strong> avec ${escapeHtml(params.practitionerName)}.
    </p>
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 0 0 24px 0; background-color: #f0f4f8; border-radius: 8px;">
      <tr>
        <td style="padding: 20px;">
          <p style="margin: 0 0 8px 0; font-weight: 600;">Soin : ${escapeHtml(params.serviceName)}</p>
          <p style="margin: 0 0 8px 0;">Date : ${escapeHtml(params.date)}</p>
          <p style="margin: 0 0 8px 0;">Heure : ${escapeHtml(params.time)}</p>
          <p style="margin: 0;">Duree : ${params.duration} minutes</p>
        </td>
      </tr>
    </table>
    <p style="margin: 0; font-size: 14px; color: #6b7280;">
      Pour toute question ou modification, veuillez contacter directement votre praticien.
    </p>
  `)
}

export async function sendBookingReminderJ3(
  params: BookingReminderEmailParams,
): Promise<EmailSendResult> {
  if (!resend) {
    throw new Error("Service email non configure (RESEND_API_KEY manquante)")
  }

  const htmlContent = buildReminderHtml(params, "dans 3 jours")

  const { data, error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: params.to,
    subject: `Rappel : votre rendez-vous dans 3 jours avec ${escapeHtml(params.practitionerName)}`,
    html: htmlContent,
  })

  if (error) {
    throw new Error(`Erreur envoi email: ${error.message}`)
  }

  return { providerMessageId: data?.id ?? null }
}

export async function sendBookingReminderJ2(
  params: BookingReminderEmailParams,
): Promise<EmailSendResult> {
  if (!resend) {
    throw new Error("Service email non configure (RESEND_API_KEY manquante)")
  }

  const htmlContent = buildReminderHtml(params, "apres-demain")

  const { data, error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: params.to,
    subject: `Rappel : votre rendez-vous apres-demain avec ${escapeHtml(params.practitionerName)}`,
    html: htmlContent,
  })

  if (error) {
    throw new Error(`Erreur envoi email: ${error.message}`)
  }

  return { providerMessageId: data?.id ?? null }
}

export async function sendBookingReminderJ1(
  params: BookingReminderEmailParams,
): Promise<EmailSendResult> {
  if (!resend) {
    throw new Error("Service email non configure (RESEND_API_KEY manquante)")
  }

  const htmlContent = buildReminderHtml(params, "demain")

  const { data, error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: params.to,
    subject: `Rappel : votre rendez-vous demain avec ${escapeHtml(params.practitionerName)}`,
    html: htmlContent,
  })

  if (error) {
    throw new Error(`Erreur envoi email: ${error.message}`)
  }

  return { providerMessageId: data?.id ?? null }
}

export async function sendBookingConfirmation(params: {
  to: string
  patientFirstName: string
  practitionerName: string
  serviceName: string
  date: string
  time: string
  duration: number
}): Promise<EmailSendResult> {
  if (!resend) {
    throw new Error("Service email non configure (RESEND_API_KEY manquante)")
  }

  const htmlContent = wrapEmailContent(`
    <h2 style="font-size: 22px; font-weight: 600; margin: 0 0 20px 0; color: #1a1a1a;">
      Bonjour ${escapeHtml(params.patientFirstName)},
    </h2>
    <p style="margin: 0 0 16px 0;">
      Votre rendez-vous avec ${escapeHtml(params.practitionerName)} a bien ete confirme.
    </p>
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 0 0 24px 0; background-color: #f0f4f8; border-radius: 8px;">
      <tr>
        <td style="padding: 20px;">
          <p style="margin: 0 0 8px 0; font-weight: 600;">Soin : ${escapeHtml(params.serviceName)}</p>
          <p style="margin: 0 0 8px 0;">Date : ${escapeHtml(params.date)}</p>
          <p style="margin: 0 0 8px 0;">Heure : ${escapeHtml(params.time)}</p>
          <p style="margin: 0;">Duree : ${params.duration} minutes</p>
        </td>
      </tr>
    </table>
    <p style="margin: 0; font-size: 14px; color: #6b7280;">
      Pour toute question ou modification, veuillez contacter directement votre praticien.
    </p>
  `)

  const { data, error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: params.to,
    subject: `Confirmation de votre rendez-vous avec ${escapeHtml(params.practitionerName)}`,
    html: htmlContent,
  })

  if (error) {
    throw new Error(`Erreur envoi email: ${error.message}`)
  }

  return { providerMessageId: data?.id ?? null }
}

export async function sendBookingCancellation(params: {
  to: string
  patientFirstName: string
  practitionerName: string
  serviceName: string
  date: string
  time: string
}): Promise<EmailSendResult> {
  if (!resend) {
    throw new Error("Service email non configure (RESEND_API_KEY manquante)")
  }

  const htmlContent = wrapEmailContent(`
    <h2 style="font-size: 22px; font-weight: 600; margin: 0 0 20px 0; color: #1a1a1a;">
      Bonjour ${escapeHtml(params.patientFirstName)},
    </h2>
    <p style="margin: 0 0 16px 0;">
      Votre rendez-vous avec ${escapeHtml(params.practitionerName)} a ete annule.
    </p>
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 0 0 24px 0; background-color: #f0f4f8; border-radius: 8px;">
      <tr>
        <td style="padding: 20px;">
          <p style="margin: 0 0 8px 0; font-weight: 600;">Soin : ${escapeHtml(params.serviceName)}</p>
          <p style="margin: 0 0 8px 0;">Date : ${escapeHtml(params.date)}</p>
          <p style="margin: 0;">Heure : ${escapeHtml(params.time)}</p>
        </td>
      </tr>
    </table>
    <p style="margin: 0; font-size: 14px; color: #6b7280;">
      Pour reprendre rendez-vous, veuillez contacter directement votre praticien.
    </p>
  `)

  const { data, error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: params.to,
    subject: `Annulation de votre rendez-vous avec ${escapeHtml(params.practitionerName)}`,
    html: htmlContent,
  })

  if (error) {
    throw new Error(`Erreur envoi email: ${error.message}`)
  }

  return { providerMessageId: data?.id ?? null }
}
