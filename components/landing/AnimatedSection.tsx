"use client"

import * as React from "react"
import { motion, MotionProps } from "framer-motion"

interface AnimatedSectionProps extends MotionProps {
  children: React.ReactNode
  className?: string
  id?: string
  as?: 'div' | 'section' | 'article' | 'header' | 'footer' | 'nav'
}

export function AnimatedSection({
  children,
  className,
  id,
  as = 'div',
  ...motionProps
}: AnimatedSectionProps) {
  const Component = motion[as]

  return (
    <Component id={id} className={className} {...motionProps}>
      {children}
    </Component>
  )
}

export function AnimatedDiv({
  children,
  className,
  id,
  ...motionProps
}: Omit<AnimatedSectionProps, 'as'>) {
  return (
    <motion.div id={id} className={className} {...motionProps}>
      {children}
    </motion.div>
  )
}

// Fade up animation preset
export const fadeUpProps: MotionProps = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6 },
}

// Fade in viewport animation preset
export const fadeInViewProps: MotionProps = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.4 },
}

// Scale hover animation preset
export const scaleHoverProps: MotionProps = {
  whileHover: { scale: 1.02 },
  transition: { duration: 0.4 },
}
