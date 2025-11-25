"use client";

import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, Sparkles, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface TrialBannerProps {
  daysRemaining: number;
  status: "TRIALING" | "ACTIVE" | "PAST_DUE" | "CANCELED" | "UNPAID";
}

export function TrialBanner({ daysRemaining, status }: TrialBannerProps) {
  const t = useTranslations("subscription.trial");

  // Don't show banner for active subscriptions
  if (status === "ACTIVE") return null;

  const isUrgent = daysRemaining <= 3;
  const isExpired = status !== "TRIALING" || daysRemaining <= 0;

  if (isExpired) {
    return (
      <div className="bg-red-50 border-b border-red-200 px-4 py-3">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <span className="text-sm font-medium text-red-800">
              {t("expired")}
            </span>
          </div>
          <Button size="sm" asChild className="bg-red-600 hover:bg-red-700">
            <Link href="/dashboard/settings?tab=billing">
              {t("banner")} - Upgrade
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "border-b px-4 py-2.5",
        isUrgent
          ? "bg-amber-50 border-amber-200"
          : "bg-indigo-50 border-indigo-200"
      )}
    >
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          {isUrgent ? (
            <Clock className="h-4 w-4 text-amber-600" />
          ) : (
            <Sparkles className="h-4 w-4 text-indigo-600" />
          )}
          <Badge
            variant="secondary"
            className={cn(
              "font-medium",
              isUrgent
                ? "bg-amber-100 text-amber-800"
                : "bg-indigo-100 text-indigo-800"
            )}
          >
            {t("banner")}
          </Badge>
          <span
            className={cn(
              "text-sm",
              isUrgent ? "text-amber-800" : "text-indigo-800"
            )}
          >
            {t("expiresIn", { days: daysRemaining })}
          </span>
        </div>
        <Button
          size="sm"
          variant="ghost"
          asChild
          className={cn(
            isUrgent
              ? "text-amber-700 hover:text-amber-900 hover:bg-amber-100"
              : "text-indigo-700 hover:text-indigo-900 hover:bg-indigo-100"
          )}
        >
          <Link href="/dashboard/settings?tab=billing">
            {t("daysRemaining", { days: daysRemaining })}
          </Link>
        </Button>
      </div>
    </div>
  );
}
