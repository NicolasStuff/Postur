import { headers } from "next/headers";

/**
 * Get the user's locale from request headers
 * Falls back to 'fr' if no locale is found
 */
async function getLocale(): Promise<string> {
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
 * Error message translations
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
