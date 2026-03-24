import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import Stripe from "stripe";

import { prisma } from "@/lib/prisma";
import { stripe, getPlanByPriceId } from "@/lib/stripe";

const MAX_RETRIES = 5;
const RETRY_BASE_DELAY_MS = 100;

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

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const duplicate = await prisma.$transaction(
        async (tx) => {
          await tx.webhookEvent.upsert({
            where: { stripeEventId: event.id },
            create: {
              stripeEventId: event.id,
              eventType: event.type,
              processed: false,
            },
            update: {
              eventType: event.type,
            },
          });

          const lockedRows = await tx.$queryRaw<Array<{ processed: boolean }>>`
            SELECT "processed"
            FROM "WebhookEvent"
            WHERE "stripeEventId" = ${event.id}
            FOR UPDATE
          `;
          const lockedEvent = lockedRows[0];

          if (lockedEvent?.processed) {
            return true;
          }

          switch (event.type) {
            case "checkout.session.completed":
              await handleCheckoutCompleted(tx, event.data.object as Stripe.Checkout.Session);
              break;

            case "customer.subscription.created":
            case "customer.subscription.updated":
              await handleSubscriptionUpdated(tx, event.data.object as Stripe.Subscription);
              break;

            case "customer.subscription.deleted":
              await handleSubscriptionDeleted(tx, event.data.object as Stripe.Subscription);
              break;

            case "invoice.payment_succeeded":
              await handlePaymentSucceeded(tx, event.data.object as Stripe.Invoice);
              break;

            case "invoice.payment_failed":
              await handlePaymentFailed(tx, event.data.object as Stripe.Invoice);
              break;

            default:
              break;
          }

          await tx.webhookEvent.update({
            where: { stripeEventId: event.id },
            data: { processed: true },
          });

          return false;
        },
        {
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        }
      );

      if (duplicate) {
        return NextResponse.json({ received: true, duplicate: true });
      }

      return NextResponse.json({ received: true });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2034" &&
        attempt < MAX_RETRIES - 1
      ) {
        const delay = RETRY_BASE_DELAY_MS * Math.pow(2, attempt) + Math.random() * 50;
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }

      console.error(`Error processing webhook ${event.type}:`, error);
      return NextResponse.json(
        { error: "Webhook processing failed" },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({ received: true });
}

function getSubscriptionPeriodEnd(subscription: Stripe.Subscription): Date | null {
  const sub = subscription as unknown as Record<string, unknown>;
  const periodEnd = sub.current_period_end;
  if (typeof periodEnd === "number") {
    return new Date(periodEnd * 1000);
  }

  const item = subscription.items?.data?.[0] as unknown as Record<string, unknown> | undefined;
  const itemPeriodEnd = item?.current_period_end;
  if (typeof itemPeriodEnd === "number") {
    return new Date(itemPeriodEnd * 1000);
  }

  return null;
}

async function resolveUserId(subscription: Stripe.Subscription): Promise<string | null> {
  const userId = subscription.metadata?.userId;
  if (userId) return userId;

  const customerId = subscription.customer as string;
  try {
    const customer = await stripe.customers.retrieve(customerId);
    if ("deleted" in customer && customer.deleted) return null;
    return (customer as Stripe.Customer).metadata?.userId || null;
  } catch {
    return null;
  }
}

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

async function handleCheckoutCompleted(tx: Prisma.TransactionClient, session: Stripe.Checkout.Session) {
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

  await tx.subscription.upsert({
    where: { userId },
    create: { userId, ...data },
    update: data,
  });
}

async function handleSubscriptionUpdated(
  tx: Prisma.TransactionClient,
  subscription: Stripe.Subscription
) {
  const customerId = subscription.customer as string;
  const priceId = subscription.items.data[0]?.price.id;
  const currentPeriodEnd = getSubscriptionPeriodEnd(subscription);

  const existingSubscription = await tx.subscription.findFirst({
    where: {
      OR: [{ stripeSubscriptionId: subscription.id }, { stripeCustomerId: customerId }],
    },
  });

  const plan = getPlanByPriceId(priceId) || existingSubscription?.plan || "PRO";
  const data = buildSubscriptionData(subscription, { customerId, plan, currentPeriodEnd });

  if (existingSubscription) {
    await tx.subscription.update({
      where: { id: existingSubscription.id },
      data,
    });
    return;
  }

  const userId = await resolveUserId(subscription);
  if (!userId) {
    console.error("Cannot resolve userId for customer:", customerId);
    return;
  }

  await tx.subscription.upsert({
    where: { userId },
    create: { userId, ...data },
    update: data,
  });
}

async function handleSubscriptionDeleted(
  tx: Prisma.TransactionClient,
  subscription: Stripe.Subscription
) {
  const customerId = subscription.customer as string;

  await tx.subscription.updateMany({
    where: {
      OR: [{ stripeSubscriptionId: subscription.id }, { stripeCustomerId: customerId }],
    },
    data: {
      status: "CANCELED",
      cancelAtPeriodEnd: false,
    },
  });
}

async function handlePaymentSucceeded(tx: Prisma.TransactionClient, invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string;
  const subscriptionId = (invoice as unknown as Record<string, unknown>).subscription as string | null;

  if (!subscriptionId) return;

  const existing = await tx.subscription.findFirst({
    where: subscriptionId
      ? { stripeSubscriptionId: subscriptionId }
      : { stripeCustomerId: customerId },
    select: { status: true },
  });

  if (existing?.status === "TRIALING") return;

  await tx.subscription.updateMany({
    where: subscriptionId
      ? { stripeSubscriptionId: subscriptionId }
      : { stripeCustomerId: customerId },
    data: { status: "ACTIVE" },
  });
}

async function handlePaymentFailed(tx: Prisma.TransactionClient, invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string;
  const subscriptionId = (invoice as unknown as Record<string, unknown>).subscription as string | null;

  await tx.subscription.updateMany({
    where: subscriptionId
      ? { stripeSubscriptionId: subscriptionId }
      : { stripeCustomerId: customerId },
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
