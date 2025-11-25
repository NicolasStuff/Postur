import Stripe from "stripe";

// Lazy initialization to avoid errors during build
let stripeInstance: Stripe | null = null;

export function getStripe(): Stripe {
  if (!stripeInstance) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error("STRIPE_SECRET_KEY is not set");
    }
    stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2025-11-17.clover",
      typescript: true,
    });
  }
  return stripeInstance;
}

// For backward compatibility
export const stripe = {
  get customers() { return getStripe().customers; },
  get subscriptions() { return getStripe().subscriptions; },
  get checkout() { return getStripe().checkout; },
  get billingPortal() { return getStripe().billingPortal; },
  get webhooks() { return getStripe().webhooks; },
};

export const PLANS = {
  PRO: {
    priceId: process.env.STRIPE_PRO_PRICE_ID || "",
    name: "Pro",
    price: 29,
    features: [
      "patients_unlimited",
      "consultations_unlimited",
      "body_chart",
      "invoicing",
      "online_booking",
      "priority_support",
    ],
  },
  PRO_IA: {
    priceId: process.env.STRIPE_PRO_IA_PRICE_ID || "",
    name: "Pro + IA",
    price: 39,
    features: [
      "patients_unlimited",
      "consultations_unlimited",
      "body_chart",
      "invoicing",
      "online_booking",
      "priority_support",
      "ai_consultation_summary",
      "ai_diagnosis_suggestions",
    ],
  },
} as const;

export type PlanKey = keyof typeof PLANS;

export function getPlanByPriceId(priceId: string): PlanKey | null {
  if (priceId === PLANS.PRO.priceId) return "PRO";
  if (priceId === PLANS.PRO_IA.priceId) return "PRO_IA";
  return null;
}
