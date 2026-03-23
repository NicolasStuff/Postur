import { stripe, getPlanByPriceId } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import Stripe from "stripe";

export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  // Idempotency check
  const existingEvent = await prisma.webhookEvent.findUnique({
    where: { stripeEventId: event.id },
  });

  if (existingEvent?.processed) {
    return NextResponse.json({ received: true, duplicate: true });
  }

  // Create webhook event record if it doesn't exist
  if (!existingEvent) {
    await prisma.webhookEvent.create({
      data: {
        stripeEventId: event.id,
        eventType: event.type,
        processed: false,
      },
    });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      case "customer.subscription.created":
      case "customer.subscription.updated":
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;

      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      case "invoice.payment_succeeded":
        await handlePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;

      case "invoice.payment_failed":
        await handlePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      // Events that don't need processing — acknowledge silently
      default:
        break;
    }

    // Mark event as processed
    await prisma.webhookEvent.update({
      where: { stripeEventId: event.id },
      data: { processed: true },
    });

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error(`Error processing webhook ${event.type}:`, error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}

/**
 * Safely extract currentPeriodEnd from a Stripe subscription object.
 * Handles API version differences where the field may be missing or null.
 */
function getSubscriptionPeriodEnd(subscription: Stripe.Subscription): Date | null {
  // Try direct property (may not exist in newer API versions)
  const periodEnd = (subscription as any).current_period_end;
  if (typeof periodEnd === "number") {
    return new Date(periodEnd * 1000);
  }

  // Fallback: use items period end
  const itemPeriodEnd = (subscription.items?.data?.[0] as any)?.current_period_end;
  if (typeof itemPeriodEnd === "number") {
    return new Date(itemPeriodEnd * 1000);
  }

  return null;
}

/**
 * Resolve userId from Stripe subscription metadata or customer metadata.
 */
async function resolveUserId(subscription: Stripe.Subscription): Promise<string | null> {
  // Try subscription metadata first
  const userId = subscription.metadata?.userId;
  if (userId) return userId;

  // Fallback: fetch customer and check its metadata
  const customerId = subscription.customer as string;
  try {
    const customer = await stripe.customers.retrieve(customerId);
    if ("deleted" in customer && customer.deleted) return null;
    return (customer as Stripe.Customer).metadata?.userId || null;
  } catch {
    return null;
  }
}

/**
 * Build the subscription data object for Prisma create/update.
 */
function buildSubscriptionData(
  subscription: Stripe.Subscription,
  opts: { customerId: string; plan: string; currentPeriodEnd: Date | null }
) {
  return {
    stripeCustomerId: opts.customerId,
    stripeSubscriptionId: subscription.id,
    stripePriceId: subscription.items.data[0]?.price.id,
    plan: opts.plan as "PRO" | "PRO_IA",
    status: mapStripeStatus(subscription.status),
    trialEndsAt: subscription.trial_end
      ? new Date(subscription.trial_end * 1000)
      : null,
    currentPeriodEnd: opts.currentPeriodEnd,
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
  };
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.userId;
  const customerId = session.customer as string;
  const subscriptionId = session.subscription as string;

  if (!userId || !customerId || !subscriptionId) {
    console.error("Missing required data in checkout session");
    return;
  }

  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const priceId = subscription.items.data[0]?.price.id;
  const plan = getPlanByPriceId(priceId) || "PRO";
  const data = buildSubscriptionData(subscription, {
    customerId,
    plan,
    currentPeriodEnd: getSubscriptionPeriodEnd(subscription),
  });

  await prisma.subscription.upsert({
    where: { userId },
    create: { userId, ...data },
    update: data,
  });
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;
  const priceId = subscription.items.data[0]?.price.id;
  const currentPeriodEnd = getSubscriptionPeriodEnd(subscription);

  const existingSubscription = await prisma.subscription.findUnique({
    where: { stripeCustomerId: customerId },
  });

  const plan = getPlanByPriceId(priceId) || existingSubscription?.plan || "PRO";
  const data = buildSubscriptionData(subscription, { customerId, plan, currentPeriodEnd });

  if (existingSubscription) {
    await prisma.subscription.update({
      where: { stripeCustomerId: customerId },
      data,
    });
    return;
  }

  // Subscription not in DB yet (race condition: this event arrived before checkout.session.completed)
  const userId = await resolveUserId(subscription);
  if (!userId) {
    console.error("Cannot resolve userId for customer:", customerId);
    return;
  }

  await prisma.subscription.upsert({
    where: { userId },
    create: { userId, ...data },
    update: data,
  });
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;

  await prisma.subscription.updateMany({
    where: { stripeCustomerId: customerId },
    data: {
      status: "CANCELED",
      cancelAtPeriodEnd: false,
    },
  });
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string;
  const subscriptionId = (invoice as any).subscription as string | null;

  if (!subscriptionId) return;

  // Don't overwrite TRIALING status — trial invoices (0€) also trigger this event
  const existing = await prisma.subscription.findFirst({
    where: { stripeCustomerId: customerId },
    select: { status: true },
  });

  if (existing?.status === "TRIALING") return;

  await prisma.subscription.updateMany({
    where: { stripeCustomerId: customerId },
    data: { status: "ACTIVE" },
  });
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string;

  await prisma.subscription.updateMany({
    where: { stripeCustomerId: customerId },
    data: { status: "PAST_DUE" },
  });
}

function mapStripeStatus(
  status: Stripe.Subscription.Status
): "TRIALING" | "ACTIVE" | "PAST_DUE" | "CANCELED" | "UNPAID" {
  const statusMap: Record<string, "TRIALING" | "ACTIVE" | "PAST_DUE" | "CANCELED" | "UNPAID"> = {
    trialing: "TRIALING",
    active: "ACTIVE",
    past_due: "PAST_DUE",
    canceled: "CANCELED",
    unpaid: "UNPAID",
    incomplete: "UNPAID",
    incomplete_expired: "CANCELED",
    paused: "CANCELED",
  };
  return statusMap[status] || "CANCELED";
}
