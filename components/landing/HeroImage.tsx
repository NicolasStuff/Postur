"use client"

import { useRef } from "react"
import Image from "next/image"
import { motion, useScroll, useTransform } from "framer-motion"

export function HeroImage() {
  const containerRef = useRef<HTMLDivElement>(null)

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  })

  // Scale effect: starts smaller, grows to full size
  const scale = useTransform(scrollYProgress, [0.1, 0.5], [0.92, 1])

  // Opacity effect
  const opacity = useTransform(scrollYProgress, [0.1, 0.4], [0.7, 1])

  return (
    <div
      ref={containerRef}
      className="relative z-20"
    >
      <div className="sticky top-0 w-full min-h-screen flex items-center justify-center bg-white py-10">
        <motion.div
          style={{ scale, opacity }}
          className="w-full max-w-6xl mx-auto px-4 lg:px-8"
        >
          {/* Browser frame */}
          <div className="relative rounded-xl lg:rounded-2xl bg-slate-900 p-1.5 lg:p-2 shadow-2xl shadow-slate-900/20 ring-1 ring-white/10">
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

            {/* Screenshot container */}
            <div className="relative bg-white rounded-b-lg lg:rounded-b-xl overflow-hidden">
              <Image
                src="/images/landing-page/new/body-chart-consultation.png"
                alt="Interface Postur : Body Chart interactif pour documenter les douleurs en consultation ostéopathique"
                width={1920}
                height={1080}
                className="w-full h-auto block"
                priority
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 90vw, 1200px"
              />
            </div>
          </div>

          {/* Subtle glow effect */}
          <div className="absolute -inset-4 lg:-inset-8 -z-10 blur-3xl opacity-20 pointer-events-none">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-[3rem]" />
          </div>
        </motion.div>
      </div>
    </div>
  )
}
