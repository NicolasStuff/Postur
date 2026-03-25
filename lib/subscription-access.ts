import { SubscriptionPlan, SubscriptionStatus } from "@prisma/client";

export const ACTIVE_SUBSCRIPTION_STATUSES: SubscriptionStatus[] = [
  "TRIALING",
  "ACTIVE",
  "PAST_DUE",
];

const AI_FEATURES = new Set([
  // Legacy aliases kept for backward compatibility while the product wording evolves.
  "ai_consultation_summary",
  "ai_diagnosis_suggestions",
  "ai_smart_notes",
  "ai_audio_soap",
  "ai_smart_notes_live",
  "ai_patient_recap",
]);

export interface SubscriptionFeatureAccess {
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
}

export function hasCoreAppAccess(
  subscription: Pick<SubscriptionFeatureAccess, "status"> | null
): boolean {
  return Boolean(subscription && ACTIVE_SUBSCRIPTION_STATUSES.includes(subscription.status))
}

export function canSubscriptionAccessFeature(
  subscription: SubscriptionFeatureAccess | null,
  feature: string
): boolean {
  if (!subscription || !hasCoreAppAccess(subscription)) {
    return false;
  }

  if (subscription.status === "TRIALING") {
    return true;
  }

  if (AI_FEATURES.has(feature)) {
    return subscription.plan === "PRO_IA";
  }

  return true;
}
