"use client"

import { useRef } from "react"
import Link from "next/link"
import Image from "next/image"
import { motion, useScroll, useTransform } from "framer-motion"
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export function HeroSection() {
  const containerRef = useRef<HTMLDivElement>(null)

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"]
  })

  // Text: stays visible, then fades out when image covers it
  const textOpacity = useTransform(scrollYProgress, [0, 0.15, 0.3], [1, 1, 0])

  // Text background: fades out so we can see sections behind when screen exits
  const bgOpacity = useTransform(scrollYProgress, [0.5, 0.75], [1, 0])

  // Image Y: enters from bottom (100%), stays at center (0%), exits to top (-100%)
  const imageY = useTransform(scrollYProgress, [0, 0.35, 0.6, 1], ["100%", "0%", "0%", "-100%"])

  // Image opacity: fades in quickly, stays visible
  const imageOpacity = useTransform(scrollYProgress, [0, 0.15], [0, 1])

  // Image scale
  const imageScale = useTransform(scrollYProgress, [0.1, 0.35], [0.92, 1])

  // Hide container completely when animation is done
  const visibility = useTransform(scrollYProgress, (value) =>
    value > 0.98 ? "hidden" : "visible"
  )

  return (
    <section ref={containerRef} className="relative h-[180vh]" aria-labelledby="hero-title">
      {/* Fixed container - becomes hidden after animation */}
      <motion.div
        className="fixed inset-0 z-40"
        style={{ visibility }}
      >

        {/* Background that fades out */}
        <motion.div
          className="absolute inset-0 bg-white"
          style={{ opacity: bgOpacity }}
        />

        {/* Text content - FIXED, never moves */}
        <motion.div
          className="absolute inset-0 z-10 flex items-center justify-center pointer-events-auto"
          style={{ opacity: textOpacity }}
        >
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-50/80 via-transparent to-transparent pointer-events-none" />

          <div className="container mx-auto px-6 relative z-10">
            <div className="flex flex-col items-center text-center max-w-4xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="mb-8"
              >
                <Badge
                  variant="secondary"
                  className="px-4 py-1.5 rounded-full bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-100 text-sm font-medium gap-2"
                >
                  Conforme Facture-X 2026
                </Badge>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                id="hero-title"
                className="text-5xl md:text-7xl font-bold tracking-tight text-slate-900 mb-6 leading-[1.1]"
              >
                Le logiciel de gestion de cabinet pour{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">
                  ostéopathes exigeants.
                </span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="text-xl text-slate-600 leading-relaxed max-w-2xl mx-auto mb-10"
              >
                <strong>Postur</strong> : le premier logiciel pour ostéopathes qui combine{" "}
                <strong>Body Chart interactif</strong>, <strong>facturation Facture-X</strong> native et{" "}
                <strong>réservation en ligne</strong>. Simplifiez votre gestion de cabinet sans usine à gaz.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="flex flex-col items-center gap-4"
              >
                <Link href="/signin">
                  <Button
                    size="lg"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full px-8 h-14 text-lg font-medium shadow-xl shadow-indigo-600/20 transition-all hover:scale-105 group"
                  >
                    Commencer l&apos;essai gratuit{" "}
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <p className="text-sm text-slate-500 font-medium">
                  14 jours d&apos;essai gratuit • Annulable à tout moment • Installation en 2 min
                </p>
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* Screen/Image - slides up from bottom, then exits to top */}
        <motion.div
          className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none"
          style={{ y: imageY, opacity: imageOpacity }}
        >
          <motion.div
            className="w-full max-w-6xl px-4 lg:px-8 pointer-events-auto"
            style={{ scale: imageScale }}
          >
            {/* Browser frame */}
            <div className="relative rounded-xl lg:rounded-2xl bg-slate-900 p-1.5 lg:p-2 shadow-2xl shadow-slate-900/30 ring-1 ring-white/10">
              {/* Browser top bar */}
              <div className="flex items-center gap-2 px-3 lg:px-4 py-2 lg:py-2.5 border-b border-slate-700/50">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
                </div>
                <div className="flex-1 flex justify-center">
                  <div className="bg-slate-800 rounded-md px-3 lg:px-4 py-1 text-[10px] lg:text-xs text-slate-400 font-mono">
                    postur.fr
                  </div>
                </div>
                <div className="w-12 lg:w-16" />
              </div>

              {/* Screenshot */}
              <div className="relative bg-white rounded-b-lg lg:rounded-b-xl overflow-hidden">
                <Image
                  src="/images/landing-page/new/body-chart-consultation.png"
                  alt="Interface Postur : Body Chart interactif pour documenter les douleurs en consultation ostéopathique"
                  width={1920}
                  height={1080}
                  className="w-full h-auto"
                  priority
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 90vw, 1200px"
                />
              </div>
            </div>

          </motion.div>
        </motion.div>
      </motion.div>
    </section>
  )
}
