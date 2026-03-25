"use client";

import { getUserProfile, updateUserProfile } from "@/app/actions/user";
import { PlanSelector } from "@/components/subscription/PlanSelector";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  getSiretValidationError,
  getSlugValidationError,
  getPublicBookingHost,
  normalizeSlug,
} from "@/lib/onboarding";
import { pushMarketingEvent } from "@/lib/marketing";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  ArrowLeft,
  Building2,
  Link2,
  Loader2,
  MapPin,
  ReceiptText,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { type FormEvent, useEffect, useState } from "react";
import { toast } from "sonner";

type Step = "profile" | "plan";

const BOOKING_HOST = getPublicBookingHost();

export default function OnboardingPage() {
  const t = useTranslations("auth.onboarding");
  const tErrors = useTranslations("errors");
  const tProfile = useTranslations("settings.profile");
  const tSubscription = useTranslations("subscription");
  const searchParams = useSearchParams();
  const checkoutStatus = searchParams.get("checkout");
  const signupStatus = searchParams.get("signup");
  const [step, setStep] = useState<Step>("profile");
  const [loading, setLoading] = useState(false);
  const [slugTouched, setSlugTouched] = useState(false);
  const { data: user, isLoading: isUserLoading } = useQuery({
    queryKey: ["userProfile"],
    queryFn: () => getUserProfile(),
  });
  const [formData, setFormData] = useState({
    companyName: "",
    companyAddress: "",
    siret: "",
    slug: "",
  });

  useEffect(() => {
    if (!user) {
      return;
    }

    const initialCompanyName = user.companyName || "";
    const initialSlug = user.slug || normalizeSlug(initialCompanyName) || "";

    setFormData({
      companyName: initialCompanyName,
      companyAddress: user.companyAddress || "",
      siret: user.siret || "",
      slug: initialSlug,
    });
    setSlugTouched(Boolean(user.slug));
  }, [user]);

  useEffect(() => {
    if (checkoutStatus === "canceled") {
      toast.error(tSubscription("checkoutCanceled"));
    }
  }, [checkoutStatus, tSubscription]);

  useEffect(() => {
    if (signupStatus !== "success") {
      return;
    }

    pushMarketingEvent("sign_up_completed", {
      location: "onboarding",
      method: "email",
    });

    const url = new URL(window.location.href);
    url.searchParams.delete("signup");
    window.history.replaceState({}, "", url.toString());
  }, [signupStatus]);

  const normalizedSlug = normalizeSlug(formData.slug) || "";
  const slugValidationError = getSlugValidationError(formData.slug);
  const siretValidationError = getSiretValidationError(formData.siret);
  const isCompanyNameValid = formData.companyName.trim().length > 0;
  const isCompanyAddressValid = formData.companyAddress.trim().length > 0;
  const isSlugValid = slugValidationError === null;
  const isSiretValid = siretValidationError === null;
  const canContinue =
    isCompanyNameValid && isCompanyAddressValid && isSlugValid && isSiretValid;

  const handleCompanyNameChange = (value: string) => {
    setFormData((current) => ({
      ...current,
      companyName: value,
      slug: slugTouched ? current.slug : normalizeSlug(value) || "",
    }));
  };

  const handleSlugChange = (value: string) => {
    setSlugTouched(true);
    setFormData((current) => ({
      ...current,
      slug: value,
    }));
  };

  const handleProfileSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!canContinue) {
      toast.error(t("requiredFieldsError"));
      return;
    }

    setLoading(true);
    try {
      await updateUserProfile({
        practitionerType: "OSTEOPATH",
        companyName: formData.companyName,
        companyAddress: formData.companyAddress,
        siret: formData.siret,
        slug: formData.slug,
      });
      setStep("plan");
    } catch (error) {
      console.error("Failed to update profile:", error);
      toast.error(error instanceof Error ? error.message : t("error"));
    } finally {
      setLoading(false);
    }
  };

  const handlePlanSelect = async (priceId: string) => {
    try {
      const plan =
        priceId === process.env.NEXT_PUBLIC_STRIPE_PRO_IA_PRICE_ID ? "PRO_IA" : "PRO";
      pushMarketingEvent("begin_checkout", {
        location: "onboarding",
        plan,
      });

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

  if (isUserLoading) {
    return (
      <div className="flex min-h-[320px] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {step === "profile" && (
        <>
          <div className="text-center space-y-3">
            <h1 className="text-3xl font-bold tracking-tight">{t("welcomeTitle")}</h1>
            <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
              {t("profileDescription")}
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
            <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 via-background to-background">
              <CardHeader className="space-y-4">
                <div
                  className={cn(
                    "flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/10"
                  )}
                >
                  <Activity className="h-6 w-6 text-blue-500" />
                </div>
                <div className="space-y-2">
                  <CardTitle>{t("osteopathTitle")}</CardTitle>
                  <CardDescription className="text-base">
                    {t("osteopathDescription")}
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-2xl border bg-background/80 p-4">
                  <p className="text-sm font-medium">{t("requiredNoticeTitle")}</p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {t("requiredNoticeDescription")}
                  </p>
                </div>

                <div className="grid gap-3">
                  <div className="flex items-start gap-3 rounded-xl border bg-background/70 p-3">
                    <Link2 className="mt-0.5 h-4 w-4 text-blue-500" />
                    <div className="space-y-1">
                      <p className="text-sm font-medium">{tProfile("publicBookingUrl")}</p>
                      <p className="text-sm text-muted-foreground">{t("publicLinkHint")}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 rounded-xl border bg-background/70 p-3">
                    <Building2 className="mt-0.5 h-4 w-4 text-blue-500" />
                    <div className="space-y-1">
                      <p className="text-sm font-medium">{tProfile("companyName")}</p>
                      <p className="text-sm text-muted-foreground">{t("companyInfoHint")}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 rounded-xl border bg-background/70 p-3">
                    <MapPin className="mt-0.5 h-4 w-4 text-blue-500" />
                    <div className="space-y-1">
                      <p className="text-sm font-medium">{tProfile("address")}</p>
                      <p className="text-sm text-muted-foreground">{t("addressHint")}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 rounded-xl border bg-background/70 p-3">
                    <ReceiptText className="mt-0.5 h-4 w-4 text-blue-500" />
                    <div className="space-y-1">
                      <p className="text-sm font-medium">{tProfile("siret")}</p>
                      <p className="text-sm text-muted-foreground">{t("siretHint")}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 shadow-sm">
              <CardHeader className="space-y-2">
                <CardTitle>{t("profileFormTitle")}</CardTitle>
                <CardDescription>{t("profileFormDescription")}</CardDescription>
              </CardHeader>
              <CardContent>
                <form className="space-y-5" onSubmit={handleProfileSubmit}>
                  <div className="grid gap-2">
                    <Label htmlFor="companyName">
                      {tProfile("companyName")} *
                    </Label>
                    <Input
                      id="companyName"
                      maxLength={120}
                      required
                      value={formData.companyName}
                      onChange={(event) => handleCompanyNameChange(event.target.value)}
                      placeholder={tProfile("companyNamePlaceholder")}
                    />
                    {formData.companyName.length > 0 && !isCompanyNameValid && (
                      <p className="text-sm text-destructive">{t("companyNameRequired")}</p>
                    )}
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="slug">
                      {tProfile("publicBookingUrl")} *
                    </Label>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">{BOOKING_HOST}/</span>
                      <Input
                        id="slug"
                        maxLength={80}
                        required
                        value={formData.slug}
                        onChange={(event) => handleSlugChange(event.target.value)}
                        placeholder={tProfile("slugPlaceholder")}
                      />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {t("bookingPreview", {
                        url: `${BOOKING_HOST}/${normalizedSlug || tProfile("slugPlaceholder")}`,
                      })}
                    </p>
                    {formData.slug.trim().length > 0 && slugValidationError && (
                      <p className="text-sm text-destructive">
                        {slugValidationError === "reserved"
                          ? tErrors("reservedSlug")
                          : tErrors("invalidSlug")}
                      </p>
                    )}
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="companyAddress">
                      {tProfile("address")} *
                    </Label>
                    <Input
                      id="companyAddress"
                      maxLength={200}
                      required
                      value={formData.companyAddress}
                      onChange={(event) =>
                        setFormData((current) => ({
                          ...current,
                          companyAddress: event.target.value,
                        }))
                      }
                      placeholder={tProfile("addressPlaceholder")}
                    />
                    {formData.companyAddress.length > 0 && !isCompanyAddressValid && (
                      <p className="text-sm text-destructive">{t("companyAddressRequired")}</p>
                    )}
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="siret">
                      {tProfile("siret")} *
                    </Label>
                    <Input
                      id="siret"
                      inputMode="numeric"
                      maxLength={20}
                      required
                      value={formData.siret}
                      onChange={(event) =>
                        setFormData((current) => ({
                          ...current,
                          siret: event.target.value,
                        }))
                      }
                      placeholder={tProfile("siretPlaceholder")}
                    />
                    {formData.siret.trim().length > 0 && siretValidationError === "invalid" && (
                      <p className="text-sm text-destructive">{tErrors("invalidSiret")}</p>
                    )}
                  </div>

                  <div className="rounded-xl border bg-muted/30 p-4">
                    <p className="text-sm text-muted-foreground">{t("requiredFieldsFootnote")}</p>
                  </div>

                  <div className="flex justify-center pt-2">
                    <Button
                      size="lg"
                      type="submit"
                      className="w-full md:w-auto min-w-[240px]"
                      disabled={loading || !canContinue}
                    >
                      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      {t("continueButton")}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {step === "plan" && (
        <>
          <div className="flex justify-start">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setStep("profile")}
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
