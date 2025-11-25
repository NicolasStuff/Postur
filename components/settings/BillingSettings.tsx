"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, ExternalLink, CreditCard, Check, Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { SubscriptionPlan, SubscriptionStatus } from "@prisma/client";

interface SubscriptionData {
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  currentPeriodEnd: Date | null;
  trialEndsAt: Date | null;
  cancelAtPeriodEnd: boolean;
}

interface BillingSettingsProps {
  subscription: SubscriptionData | null;
  showUpgradeModal?: boolean;
}

export function BillingSettings({ subscription, showUpgradeModal }: BillingSettingsProps) {
  const t = useTranslations("subscription");
  const [loading, setLoading] = useState<string | null>(null);

  const handleManageBilling = async () => {
    setLoading("portal");
    try {
      const response = await fetch("/api/stripe/portal", { method: "POST" });
      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error("Portal error:", error);
    } finally {
      setLoading(null);
    }
  };

  const handleSubscribe = async (priceId: string) => {
    setLoading(priceId);
    try {
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId }),
      });

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error("Checkout error:", error);
    } finally {
      setLoading(null);
    }
  };

  const getStatusBadge = (status: SubscriptionStatus) => {
    const variants: Record<SubscriptionStatus, { variant: "default" | "secondary" | "destructive" | "outline"; className?: string }> = {
      TRIALING: { variant: "secondary", className: "bg-indigo-100 text-indigo-800" },
      ACTIVE: { variant: "default", className: "bg-green-100 text-green-800" },
      PAST_DUE: { variant: "destructive" },
      CANCELED: { variant: "outline" },
      UNPAID: { variant: "destructive" },
    };

    const config = variants[status];
    return (
      <Badge variant={config.variant} className={config.className}>
        {t(`billing.status.${status.toLowerCase()}`)}
      </Badge>
    );
  };

  const formatDate = (date: Date | null) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const isActive = subscription && ["TRIALING", "ACTIVE", "PAST_DUE"].includes(subscription.status);

  // Show plans if no subscription or subscription is inactive
  if (!subscription || !isActive) {
    return (
      <div className="space-y-6">
        {showUpgradeModal && (
          <Card className="border-amber-200 bg-amber-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-100 rounded-full">
                  <CreditCard className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="font-medium text-amber-900">{t("upgrade.title")}</p>
                  <p className="text-sm text-amber-700">{t("upgrade.description")}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          {/* Pro Plan */}
          <PlanCard
            name="Pro"
            price={29}
            features={[
              t("features.unlimitedPatients"),
              t("features.unlimitedConsultations"),
              t("features.bodyChart"),
              t("features.invoicing"),
              t("features.onlineBooking"),
              t("features.prioritySupport"),
            ]}
            priceId={process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID || ""}
            isLoading={loading}
            onSubscribe={handleSubscribe}
          />

          {/* Pro + IA Plan */}
          <PlanCard
            name="Pro + IA"
            price={39}
            popular
            features={[
              t("features.everythingInPro"),
              t("features.aiConsultationSummary"),
              t("features.aiDiagnosisSuggestions"),
              t("features.aiSmartNotes"),
            ]}
            priceId={process.env.NEXT_PUBLIC_STRIPE_PRO_IA_PRICE_ID || ""}
            isLoading={loading}
            onSubscribe={handleSubscribe}
          />
        </div>
      </div>
    );
  }

  // Show current subscription
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-3">
                {t("billing.currentPlan")}
                {getStatusBadge(subscription.status)}
              </CardTitle>
              <CardDescription className="mt-1">
                {subscription.plan === "PRO_IA" ? "Pro + IA" : "Pro"} - {subscription.plan === "PRO_IA" ? "39" : "29"}€/{t("month")}
              </CardDescription>
            </div>
            {subscription.plan === "PRO_IA" && (
              <div className="p-2 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2 text-sm">
            {subscription.status === "TRIALING" && subscription.trialEndsAt && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Fin de l'essai</span>
                <span className="font-medium">{formatDate(subscription.trialEndsAt)}</span>
              </div>
            )}
            {subscription.currentPeriodEnd && subscription.status !== "TRIALING" && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  {subscription.cancelAtPeriodEnd ? "Accès jusqu'au" : "Prochain renouvellement"}
                </span>
                <span className="font-medium">{formatDate(subscription.currentPeriodEnd)}</span>
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <Button onClick={handleManageBilling} disabled={loading === "portal"}>
              {loading === "portal" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t("billing.manageBilling")}
              <ExternalLink className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Upgrade prompt for Pro users */}
      {subscription.plan === "PRO" && subscription.status === "ACTIVE" && (
        <Card className="border-indigo-200 bg-gradient-to-r from-indigo-50 to-purple-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-indigo-600" />
              {t("upgrade.title")}
            </CardTitle>
            <CardDescription>{t("upgrade.description")}</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 mb-4">
              {[
                t("features.aiConsultationSummary"),
                t("features.aiDiagnosisSuggestions"),
                t("features.aiSmartNotes"),
              ].map((feature, i) => (
                <li key={i} className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-indigo-600" />
                  {feature}
                </li>
              ))}
            </ul>
            <Button
              onClick={handleManageBilling}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              {t("upgrade.cta")} - +10€/{t("month")}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

interface PlanCardProps {
  name: string;
  price: number;
  features: string[];
  priceId: string;
  popular?: boolean;
  isLoading: string | null;
  onSubscribe: (priceId: string) => void;
}

function PlanCard({ name, price, features, priceId, popular, isLoading, onSubscribe }: PlanCardProps) {
  const t = useTranslations("subscription");

  return (
    <Card
      className={cn(
        "relative cursor-pointer transition-all hover:shadow-lg",
        popular && "border-indigo-500 border-2"
      )}
    >
      {popular && (
        <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-500">
          <Sparkles className="w-3 h-3 mr-1" />
          {t("popular")}
        </Badge>
      )}

      <CardHeader className="text-center pb-2">
        <CardTitle className="text-xl">{name}</CardTitle>
        <div className="flex items-baseline justify-center gap-1 mt-2">
          <span className="text-4xl font-bold">{price}€</span>
          <span className="text-muted-foreground">/ {t("month")}</span>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <ul className="space-y-2">
          {features.map((feature, i) => (
            <li key={i} className="flex items-start gap-2 text-sm">
              <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>

        <Button
          className={cn(
            "w-full",
            popular
              ? "bg-indigo-600 hover:bg-indigo-700"
              : "bg-slate-800 hover:bg-slate-900"
          )}
          disabled={isLoading !== null}
          onClick={() => onSubscribe(priceId)}
        >
          {isLoading === priceId ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t("redirecting")}
            </>
          ) : (
            t("startTrial")
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
