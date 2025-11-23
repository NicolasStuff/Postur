"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Activity, Loader2 } from "lucide-react";
import { updateUserProfile } from "@/app/actions/user";
import { useRouter } from "next/navigation";

export default function OnboardingPage() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleContinue = async () => {
    setLoading(true);
    try {
      await updateUserProfile({ practitionerType: "OSTEOPATH" });
      router.push("/dashboard");
    } catch (error) {
      console.error("Failed to update profile:", error);
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Bienvenue sur Postur</h1>
        <p className="text-muted-foreground text-lg">
          Votre logiciel de gestion pour ostéopathes
        </p>
      </div>

      <div className="flex justify-center">
        <Card className="max-w-md w-full border-2 border-blue-200">
          <CardHeader>
            <div className={cn("w-12 h-12 rounded-lg flex items-center justify-center mb-4 bg-blue-500/10")}>
              <Activity className={cn("w-6 h-6 text-blue-500")} />
            </div>
            <CardTitle>Ostéopathe</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription className="text-base">
              Gestion complète de vos consultations d'ostéopathie : schéma corporel, historique des traumatismes, notes de consultation et bien plus.
            </CardDescription>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-center pt-4">
        <Button
          size="lg"
          className="w-full md:w-auto min-w-[200px]"
          disabled={loading}
          onClick={handleContinue}
        >
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Continuer vers le Dashboard
        </Button>
      </div>
    </div>
  );
}
