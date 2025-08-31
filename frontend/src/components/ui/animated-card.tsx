'use client'

import { motion } from 'framer-motion'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface AnimatedCardProps extends React.HTMLAttributes<HTMLDivElement> {
  delay?: number
  duration?: number
  direction?: 'up' | 'down' | 'left' | 'right'
}

export function AnimatedCard({ 
  children, 
  className, 
  delay = 0, 
  duration = 0.5,
  direction = 'up',
  ...props 
}: AnimatedCardProps) {
  const directions = {
    up: { y: 20, x: 0 },
    down: { y: -20, x: 0 },
    left: { y: 0, x: 20 },
    right: { y: 0, x: -20 }
  }

  return (
    <motion.div
      initial={{ 
        opacity: 0, 
        ...directions[direction]
      }}
      animate={{ 
        opacity: 1, 
        y: 0, 
        x: 0 
      }}
      transition={{ 
        duration, 
        delay,
        ease: "easeOut"
      }}
      whileHover={{ 
        scale: 1.02,
        transition: { duration: 0.2 }
      }}
    >
      <Card className={cn("transition-all", className)} {...props}>
        {children}
      </Card>
    </motion.div>
  )
}

export function FadeIn({ 
  children, 
  delay = 0, 
  duration = 0.5 
}: { 
  children: React.ReactNode
  delay?: number
  duration?: number 
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration, delay, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  )
}

export function SlideIn({ 
  children, 
  direction = 'left',
  delay = 0, 
  duration = 0.5 
}: { 
  children: React.ReactNode
  direction?: 'left' | 'right' | 'up' | 'down'
  delay?: number
  duration?: number 
}) {
  const directions = {
    left: { x: -50 },
    right: { x: 50 },
    up: { y: -50 },
    down: { y: 50 }
  }

  return (
    <motion.div
      initial={{ opacity: 0, ...directions[direction] }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      transition={{ duration, delay, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  )
}

export function Stagger({ 
  children, 
  staggerDelay = 0.1,
  className 
}: { 
  children: React.ReactNode
  staggerDelay?: number
  className?: string
}) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: {
            staggerChildren: staggerDelay
          }
        }
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
}