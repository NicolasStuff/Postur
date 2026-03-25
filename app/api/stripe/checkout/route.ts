import { auth } from "@/lib/auth";
import { stripe, getPlanByPriceId } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { SubscriptionStatus } from "@prisma/client";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { priceId } = await req.json();

    // Validate price ID
    const plan = getPlanByPriceId(priceId);
    if (!plan) {
      return NextResponse.json({ error: "Invalid price ID" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { subscription: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const blockingStatuses: SubscriptionStatus[] = ["TRIALING", "ACTIVE", "PAST_DUE"];
    if (user.subscription && blockingStatuses.includes(user.subscription.status)) {
      return NextResponse.json(
        { error: "Subscription already exists. Please manage billing instead." },
        { status: 409 }
      );
    }

    // Check if user already has a subscription
    let customerId = user.subscription?.stripeCustomerId;

    // Create Stripe customer if doesn't exist
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: session.user.email,
        name: user.name || undefined,
        metadata: { userId: session.user.id },
      });
      customerId = customer.id;
    }

    // Create checkout session with 14-day trial
    const checkoutSession = await stripe.checkout.sessions.create(
      {
        customer: customerId,
        mode: "subscription",
        payment_method_types: ["card"],
        line_items: [{ price: priceId, quantity: 1 }],
      subscription_data: {
        trial_period_days: 14,
        metadata: { userId: session.user.id },
      },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/success?plan=${plan}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/onboarding?checkout=canceled`,
        metadata: { userId: session.user.id },
        automatic_tax: { enabled: false },
        allow_promotion_codes: true,
      },
      {
        idempotencyKey: `checkout:${session.user.id}:${priceId}`,
      }
    );

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
