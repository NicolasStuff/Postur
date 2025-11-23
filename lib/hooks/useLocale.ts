"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

/**
 * Hook to manage user locale preference
 * Fetches the user's language preference from the database
 * and provides a function to update it
 */
export function useLocale() {
  const [locale, setLocale] = useState<string>("fr");
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function fetchUserLocale() {
      try {
        const response = await fetch("/api/user/locale");
        if (response.ok) {
          const data = await response.json();
          if (data.locale) {
            setLocale(data.locale);
          }
        }
      } catch (error) {
        console.error("Failed to fetch user locale:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchUserLocale();
  }, []);

  const updateLocale = async (newLocale: string) => {
    try {
      const response = await fetch("/api/user/locale", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ locale: newLocale }),
      });

      if (response.ok) {
        setLocale(newLocale);
        // Redirect to the new locale route
        const currentPath = window.location.pathname;
        const pathWithoutLocale = currentPath.replace(/^\/(fr|en)/, "");
        router.push(`/${newLocale}${pathWithoutLocale}`);
        router.refresh();
      }
    } catch (error) {
      console.error("Failed to update user locale:", error);
    }
  };

  return {
    locale,
    updateLocale,
    isLoading,
  };
}
