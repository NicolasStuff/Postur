"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Activity, Leaf, Brain, Loader2, Check } from "lucide-react";
import { updateUserProfile } from "@/app/actions/user";
import { useRouter } from "next/navigation";
import { PractitionerType } from "@prisma/client";

const PRACTITIONER_TYPES = [
  {
    id: "OSTEOPATH",
    title: "Osteopath",
    description: "Structural, visceral, and cranial osteopathy.",
    icon: Activity,
    color: "text-blue-500",
    bg: "bg-blue-500/10",
    border: "border-blue-200 hover:border-blue-500",
  },
  {
    id: "NATUROPATH",
    title: "Naturopath",
    description: "Holistic health, nutrition, and lifestyle advice.",
    icon: Leaf,
    color: "text-green-500",
    bg: "bg-green-500/10",
    border: "border-green-200 hover:border-green-500",
  },
  {
    id: "SOPHROLOGIST",
    title: "Sophrologist",
    description: "Relaxation, breathing, and visualization techniques.",
    icon: Brain,
    color: "text-purple-500",
    bg: "bg-purple-500/10",
    border: "border-purple-200 hover:border-purple-500",
  },
];

export default function OnboardingPage() {
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleContinue = async () => {
    if (!selected) return;
    setLoading(true);
    try {
      await updateUserProfile({ practitionerType: selected as PractitionerType });
      router.push("/dashboard");
    } catch (error) {
      console.error("Failed to update profile:", error);
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Welcome to TheraFlow</h1>
        <p className="text-muted-foreground text-lg">
          To get started, please tell us what type of practitioner you are.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {PRACTITIONER_TYPES.map((type) => {
          const Icon = type.icon;
          const isSelected = selected === type.id;

          return (
            <Card
              key={type.id}
              className={cn(
                "cursor-pointer transition-all duration-200 relative overflow-hidden",
                "hover:shadow-md border-2",
                isSelected ? "border-primary ring-1 ring-primary" : "border-transparent hover:border-muted-foreground/25",
                type.border
              )}
              onClick={() => setSelected(type.id)}
            >
              {isSelected && (
                <div className="absolute top-3 right-3 bg-primary text-primary-foreground rounded-full p-1">
                  <Check className="w-4 h-4" />
                </div>
              )}
              <CardHeader>
                <div className={cn("w-12 h-12 rounded-lg flex items-center justify-center mb-4", type.bg)}>
                  <Icon className={cn("w-6 h-6", type.color)} />
                </div>
                <CardTitle>{type.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  {type.description}
                </CardDescription>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="flex justify-center pt-4">
        <Button 
          size="lg" 
          className="w-full md:w-auto min-w-[200px]" 
          disabled={!selected || loading}
          onClick={handleContinue}
        >
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Continue to Dashboard
        </Button>
      </div>
    </div>
  );
}
