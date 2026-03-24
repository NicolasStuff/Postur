"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Check, Loader2, Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";

interface Plan {
  id: string;
  priceId: string;
  name: string;
  price: number;
  features: string[];
  popular?: boolean;
}

interface PlanSelectorProps {
  onSelect: (priceId: string) => Promise<void>;
}

export function PlanSelector({ onSelect }: PlanSelectorProps) {
  const t = useTranslations("subscription");
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const plans: Plan[] = [
    {
      id: "PRO",
      priceId: process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID || "",
      name: "Pro",
      price: 29,
      features: [
        t("features.unlimitedPatients"),
        t("features.unlimitedConsultations"),
        t("features.bodyChart"),
        t("features.invoicing"),
        t("features.onlineBooking"),
        t("features.prioritySupport"),
      ],
    },
    {
      id: "PRO_IA",
      priceId: process.env.NEXT_PUBLIC_STRIPE_PRO_IA_PRICE_ID || "",
      name: "Pro + IA",
      price: 39,
      popular: true,
      features: [
        t("features.everythingInPro"),
        t("features.aiConsultationSummary"),
        t("features.aiDiagnosisSuggestions"),
        t("features.aiSmartNotes"),
      ],
    },
  ];

  const handleSelect = async (plan: Plan) => {
    if (!plan.priceId) {
      toast.error(t("configurationError"));
      return;
    }

    setSelectedPlan(plan.id);
    setLoading(true);
    try {
      await onSelect(plan.priceId);
    } catch (error) {
      console.error("Failed to select plan:", error);
      toast.error(t("checkoutError"));
      setLoading(false);
      setSelectedPlan(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">{t("choosePlan")}</h2>
        <p className="text-muted-foreground">
          {t("trialDescription")}
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
        {plans.map((plan) => (
          <Card
            key={plan.id}
            className={cn(
              "relative transition-all hover:shadow-lg",
              plan.priceId ? "cursor-pointer" : "cursor-not-allowed opacity-80",
              plan.popular && "border-indigo-500 border-2",
              selectedPlan === plan.id && "ring-2 ring-indigo-500"
            )}
            onClick={() => !loading && handleSelect(plan)}
          >
            {plan.popular && (
              <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-500">
                <Sparkles className="w-3 h-3 mr-1" />
                {t("popular")}
              </Badge>
            )}

            <CardHeader className="text-center pb-2">
              <CardTitle className="text-xl">{plan.name}</CardTitle>
              <div className="flex items-baseline justify-center gap-1 mt-2">
                <span className="text-4xl font-bold">{plan.price}€</span>
                <span className="text-muted-foreground">/ {t("month")}</span>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <ul className="space-y-2">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              {!plan.priceId && (
                <p className="text-sm font-medium text-amber-700">
                  {t("configurationError")}
                </p>
              )}

              <Button
                className={cn(
                  "w-full",
                  plan.popular
                    ? "bg-indigo-600 hover:bg-indigo-700"
                    : "bg-slate-800 hover:bg-slate-900"
                )}
                disabled={loading || !plan.priceId}
              >
                {loading && selectedPlan === plan.id ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t("redirecting")}
                  </>
                ) : (
                  plan.priceId ? t("startTrial") : t("configurationCta")
                )}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <p className="text-center text-sm text-muted-foreground">
        {t("trialNote")}
      </p>
    </div>
  );
}
