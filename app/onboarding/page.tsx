"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Activity, Loader2, ArrowLeft } from "lucide-react";
import { updateUserProfile } from "@/app/actions/user";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { PlanSelector } from "@/components/subscription/PlanSelector";
import { toast } from "sonner";

type Step = "practitioner" | "plan";

export default function OnboardingPage() {
  const t = useTranslations("auth.onboarding");
  const tSubscription = useTranslations("subscription");
  const [step, setStep] = useState<Step>("practitioner");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Handle checkout canceled
  const checkoutStatus = searchParams.get("checkout");
  if (checkoutStatus === "canceled") {
    toast.error(tSubscription("checkoutCanceled"));
  }

  const handlePractitionerSelect = async () => {
    setLoading(true);
    try {
      await updateUserProfile({ practitionerType: "OSTEOPATH" });
      setStep("plan");
    } catch (error) {
      console.error("Failed to update profile:", error);
      toast.error(t("error"));
    } finally {
      setLoading(false);
    }
  };

  const handlePlanSelect = async (priceId: string) => {
    try {
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Checkout failed");
      }

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error("Checkout error:", error);
      toast.error(tSubscription("checkoutError"));
      throw error;
    }
  };

  return (
    <div className="space-y-8">
      {step === "practitioner" && (
        <>
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">{t("welcomeTitle")}</h1>
            <p className="text-muted-foreground text-lg">
              {t("welcomeDescription")}
            </p>
          </div>

          <div className="flex justify-center">
            <Card className="max-w-md w-full border-2 border-blue-200">
              <CardHeader>
                <div className={cn("w-12 h-12 rounded-lg flex items-center justify-center mb-4 bg-blue-500/10")}>
                  <Activity className={cn("w-6 h-6 text-blue-500")} />
                </div>
                <CardTitle>{t("osteopathTitle")}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  {t("osteopathDescription")}
                </CardDescription>
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-center pt-4">
            <Button
              size="lg"
              className="w-full md:w-auto min-w-[200px]"
              disabled={loading}
              onClick={handlePractitionerSelect}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t("continueButton")}
            </Button>
          </div>
        </>
      )}

      {step === "plan" && (
        <>
          <div className="flex justify-start">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setStep("practitioner")}
              className="text-muted-foreground"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t("back")}
            </Button>
          </div>

          <PlanSelector onSelect={handlePlanSelect} />
        </>
      )}
    </div>
  );
}
