import { cookies, headers } from "next/headers";

/**
 * Get the user's locale from request headers
 * Falls back to 'fr' if no locale is found
 */
async function getLocale(): Promise<string> {
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get("NEXT_LOCALE")?.value;

  if (cookieLocale === "en" || cookieLocale === "fr") {
    return cookieLocale;
  }

  const headersList = await headers();
  const acceptLanguage = headersList.get("accept-language");

  if (acceptLanguage) {
    // Parse accept-language header (e.g., "en-US,en;q=0.9,fr;q=0.8")
    const locale = acceptLanguage.split(",")[0].split("-")[0];
    return locale === "en" ? "en" : "fr";
  }

  return "fr"; // Default to French
}

/**
 * Server-side error message translations.
 *
 * These keys (ERROR_MESSAGES) are used by server actions and API routes.
 * They are a SEPARATE system from the client-side translations in
 * messages/en.json and messages/fr.json (which are loaded by next-intl).
 * Both systems must be kept in sync manually when error wording changes.
 */
const ERROR_MESSAGES: Record<string, Record<string, string>> = {
  en: {
    unauthorized: "Unauthorized",
    notFound: "Resource not found",
    invalidInput: "Invalid input data",
    serverError: "An internal server error occurred",
    failedToCreate: "Failed to create resource",
    failedToUpdate: "Failed to update resource",
    failedToDelete: "Failed to delete resource",
    practitionerNotFound: "Practitioner not found",
    serviceNotFound: "Service not found",
    invoiceNotFound: "Invoice not found",
    appointmentNotFound: "Appointment not found",
    patientNotFound: "Patient not found",
    consultationNotFound: "Consultation not found",
    consultationAlreadyBilled: "This consultation has already been billed",
    consultationCannotBeBilled: "Only attended appointments that have already started can be billed",
    invalidDate: "Invalid date",
    invalidTimeSlot: "Invalid time slot",
    slotNotAvailable: "This time slot is not available",
    missingRequiredField: "Missing required field",
    emailAlreadyExists: "This email is already in use",
    weakPassword: "Password is too weak",
    invalidCredentials: "Invalid credentials",
    sessionExpired: "Your session has expired",
    accessDenied: "Access denied",
    resourceNotOwned: "You don't have permission to access this resource",
    duplicateEntry: "This entry already exists",
    operationFailed: "Operation failed",
    networkError: "Network error occurred",
    timeoutError: "Request timed out",
    validationError: "Validation error",
    databaseError: "Database error occurred",
    defaultVatRateRequired: "Set a default VAT rate when VAT is enabled",
    billingProfileIncomplete: "Complete your billing profile before creating or editing invoices",
    invoiceLocked: "Only draft invoices can still be edited",
    invoiceCannotDelete: "Only draft invoices can be deleted",
    invoiceCannotCancel: "This invoice cannot be cancelled",
    invalidStatusTransition: "This status change is not allowed",
    emailSendFailed: "Failed to send the email",
    subscriptionRequired: "An active subscription is required to access this feature",
    invalidSlug: "The public booking URL is invalid",
    reservedSlug: "This public booking URL is reserved",
    slugAlreadyExists: "This public booking URL is already in use",
    invalidSiret: "The SIRET must contain 14 digits",
    profileIncomplete: "Complete your practice information to continue",
    tooManyRequests: "Too many requests. Please try again later",
    aiFeatureUnavailable: "These AI features are only available with Pro + AI",
    aiConsentRequired: "You must accept AI data processing before using these features",
    aiAudioFileRequired: "Add an audio file to start the transcription",
    aiAudioEmpty: "The uploaded audio file is empty",
    aiAudioTooLarge: "The uploaded audio file is too large",
    aiAudioProcessingFailed: "Unable to transcribe the audio right now",
    patientRecapRequiresNote: "Add a note or use the SOAP draft to generate a patient recap",
  },
  fr: {
    unauthorized: "Non authentifié",
    notFound: "Ressource introuvable",
    invalidInput: "Données d'entrée invalides",
    serverError: "Une erreur interne s'est produite",
    failedToCreate: "Échec de la création de la ressource",
    failedToUpdate: "Échec de la mise à jour de la ressource",
    failedToDelete: "Échec de la suppression de la ressource",
    practitionerNotFound: "Praticien introuvable",
    serviceNotFound: "Service introuvable",
    invoiceNotFound: "Facture introuvable",
    appointmentNotFound: "Rendez-vous introuvable",
    patientNotFound: "Patient introuvable",
    consultationNotFound: "Consultation introuvable",
    consultationAlreadyBilled: "Cette consultation a déjà été facturée",
    consultationCannotBeBilled: "Seuls les rendez-vous commencés et honorés peuvent être facturés",
    invalidDate: "Date invalide",
    invalidTimeSlot: "Créneau horaire invalide",
    slotNotAvailable: "Ce créneau horaire n'est pas disponible",
    missingRequiredField: "Champ requis manquant",
    emailAlreadyExists: "Cet email est déjà utilisé",
    weakPassword: "Le mot de passe est trop faible",
    invalidCredentials: "Identifiants invalides",
    sessionExpired: "Votre session a expiré",
    accessDenied: "Accès refusé",
    resourceNotOwned: "Vous n'avez pas la permission d'accéder à cette ressource",
    duplicateEntry: "Cette entrée existe déjà",
    operationFailed: "L'opération a échoué",
    networkError: "Erreur réseau",
    timeoutError: "Délai d'attente dépassé",
    validationError: "Erreur de validation",
    databaseError: "Erreur de base de données",
    defaultVatRateRequired: "Définissez un taux de TVA par défaut lorsque la TVA est activée",
    billingProfileIncomplete: "Complétez votre profil de facturation avant de créer ou modifier des factures",
    invoiceLocked: "Seules les factures en brouillon peuvent encore être modifiées",
    invoiceCannotDelete: "Seules les factures en brouillon peuvent être supprimées",
    invoiceCannotCancel: "Cette facture ne peut pas être annulée",
    invalidStatusTransition: "Ce changement de statut n'est pas autorisé",
    emailSendFailed: "L'envoi de l'email a échoué",
    subscriptionRequired: "Un abonnement actif est requis pour accéder à cette fonctionnalité",
    invalidSlug: "L'URL publique de réservation est invalide",
    reservedSlug: "Cette URL publique de réservation est réservée",
    slugAlreadyExists: "Cette URL publique de réservation est déjà utilisée",
    invalidSiret: "Le SIRET doit contenir 14 chiffres",
    profileIncomplete: "Complétez les informations de votre cabinet pour continuer",
    tooManyRequests: "Trop de requêtes. Merci de réessayer plus tard",
    aiFeatureUnavailable: "Ces fonctionnalités IA sont réservées à Pro + IA",
    aiConsentRequired: "Vous devez accepter le traitement IA avant d'utiliser ces fonctionnalités",
    aiAudioFileRequired: "Ajoutez un fichier audio pour lancer la transcription",
    aiAudioEmpty: "Le fichier audio importé est vide",
    aiAudioTooLarge: "Le fichier audio importé est trop volumineux",
    aiAudioProcessingFailed: "Impossible de transcrire l'audio pour le moment",
    patientRecapRequiresNote: "Ajoutez une note ou utilisez le brouillon SOAP pour générer un compte-rendu patient",
  },
};

/**
 * Get an error message in the user's language
 * @param key - The error message key
 * @param locale - Optional locale override. If not provided, will be detected from headers
 * @returns The localized error message
 */
export async function getErrorMessage(
  key: string,
  locale?: string
): Promise<string> {
  const resolvedLocale = locale || (await getLocale());
  const messages = ERROR_MESSAGES[resolvedLocale] || ERROR_MESSAGES["fr"];
  return messages[key] || messages["serverError"];
}

/**
 * Synchronous version of getErrorMessage for cases where async is not possible
 * Defaults to French
 */
export function getErrorMessageSync(key: string, locale: string = "fr"): string {
  const messages = ERROR_MESSAGES[locale] || ERROR_MESSAGES["fr"];
  return messages[key] || messages["serverError"];
}
