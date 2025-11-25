"use client"

import Link from "next/link"
import { Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"

export function MobileMenu() {
  return (
    <div className="md:hidden">
      <Sheet>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="text-slate-900"
            aria-label="Ouvrir le menu de navigation"
          >
            <Menu className="h-6 w-6" />
          </Button>
        </SheetTrigger>
        <SheetContent side="right" className="w-[300px] sm:w-[400px]">
          <nav className="flex flex-col gap-8 mt-10" aria-label="Menu mobile">
            <Link
              href="#features"
              className="text-lg font-medium text-slate-900 hover:text-indigo-600"
            >
              Fonctionnalités
            </Link>
            <Link
              href="#facture-x"
              className="text-lg font-medium text-slate-900 hover:text-indigo-600"
            >
              Facture-X
            </Link>
            <Link
              href="#pricing"
              className="text-lg font-medium text-slate-900 hover:text-indigo-600"
            >
              Tarifs
            </Link>
            <hr className="border-slate-100" />
            <div className="flex flex-col gap-4">
              <Link href="/signin?tab=signin">
                <Button variant="ghost" className="w-full justify-start text-slate-600">
                  Connexion
                </Button>
              </Link>
              <Link href="/signin">
                <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-full">
                  Essai Gratuit
                </Button>
              </Link>
            </div>
          </nav>
        </SheetContent>
      </Sheet>
    </div>
  )
}
