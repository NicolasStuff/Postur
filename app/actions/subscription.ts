"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  ACTIVE_SUBSCRIPTION_STATUSES,
  canSubscriptionAccessFeature,
} from "@/lib/subscription-access";
import { headers } from "next/headers";
import { SubscriptionPlan, SubscriptionStatus } from "@prisma/client";

export interface SubscriptionData {
  id: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  trialEndsAt: Date | null;
  currentPeriodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
}

export async function getSubscription(): Promise<SubscriptionData | null> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return null;

  const subscription = await prisma.subscription.findUnique({
    where: { userId: session.user.id },
    select: {
      id: true,
      plan: true,
      status: true,
      trialEndsAt: true,
      currentPeriodEnd: true,
      cancelAtPeriodEnd: true,
    },
  });

  return subscription;
}

export async function hasActiveSubscription(): Promise<boolean> {
  const subscription = await getSubscription();
  if (!subscription) return false;

  return ACTIVE_SUBSCRIPTION_STATUSES.includes(subscription.status);
}

export async function canAccessFeature(feature: string): Promise<boolean> {
  const subscription = await getSubscription();
  return canSubscriptionAccessFeature(subscription, feature);
}

export async function getTrialDaysRemaining(): Promise<number | null> {
  const subscription = await getSubscription();
  if (!subscription || subscription.status !== "TRIALING" || !subscription.trialEndsAt) {
    return null;
  }

  const now = new Date();
  const trialEnd = new Date(subscription.trialEndsAt);
  const diffTime = trialEnd.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return Math.max(0, diffDays);
}

export async function isTrialExpired(): Promise<boolean> {
  const subscription = await getSubscription();
  if (!subscription) return true;

  if (subscription.status === "TRIALING" && subscription.trialEndsAt) {
    return new Date() > new Date(subscription.trialEndsAt);
  }

  // Not in trial, check if subscription is inactive
  return !ACTIVE_SUBSCRIPTION_STATUSES.includes(subscription.status);
}
