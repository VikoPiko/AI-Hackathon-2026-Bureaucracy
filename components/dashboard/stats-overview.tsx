"use client"

import { useEffect, useState, useRef } from "react"
import { motion, useInView, useSpring, useTransform } from "motion/react"
import { Card, CardContent } from "@/components/ui/card"
import { FileText, CheckCircle2, Clock, TrendingUp } from "lucide-react"

interface Stat {
  label: string
  value: number
  icon: React.ElementType
  description: string
  color: string
  bgColor: string
  suffix?: string
}

const stats: Stat[] = [
  {
    label: "Documents Analyzed",
    value: 12,
    icon: FileText,
    description: "Total analyses",
    color: "text-primary",
    bgColor: "bg-primary/10",
  },
  {
    label: "Procedures Tracked",
    value: 3,
    icon: Clock,
    description: "In progress",
    color: "text-amber-500",
    bgColor: "bg-amber-500/10",
  },
  {
    label: "Completed",
    value: 5,
    icon: CheckCircle2,
    description: "All time",
    color: "text-accent",
    bgColor: "bg-accent/10",
  },
  {
    label: "Time Saved",
    value: 8,
    icon: TrendingUp,
    description: "Hours estimated",
    color: "text-green-500",
    bgColor: "bg-green-500/10",
    suffix: "h",
  },
]

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.25, 0.4, 0.25, 1] },
  },
}

function AnimatedNumber({ value, suffix = "" }: { value: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true })
  const spring = useSpring(0, { stiffness: 100, damping: 30 })
  const display = useTransform(spring, (latest) => Math.round(latest))
  const [displayValue, setDisplayValue] = useState(0)

  useEffect(() => {
    if (inView) {
      spring.set(value)
    }
  }, [inView, spring, value])

  useEffect(() => {
    const unsubscribe = display.on("change", (latest) => {
      setDisplayValue(latest)
    })
    return () => unsubscribe()
  }, [display])

  return (
    <span ref={ref}>
      {displayValue}{suffix}
    </span>
  )
}

export function StatsOverview() {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
    >
      {stats.map((stat, index) => (
        <motion.div key={stat.label} variants={itemVariants}>
          <motion.div
            whileHover={{ scale: 1.02, y: -4 }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
          >
            <Card className="relative overflow-hidden group cursor-default">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <p className="text-3xl font-bold mt-1 tabular-nums">
                      <AnimatedNumber value={stat.value} suffix={stat.suffix} />
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {stat.description}
                    </p>
                  </div>
                  <motion.div 
                    className={`h-12 w-12 rounded-xl ${stat.bgColor} flex items-center justify-center ${stat.color}`}
                    whileHover={{ rotate: 12, scale: 1.1 }}
                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                  >
                    <stat.icon className="h-6 w-6" />
                  </motion.div>
                </div>
              </CardContent>
              
              {/* Hover gradient overlay */}
              <motion.div 
                className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none`}
                style={{
                  background: `radial-gradient(circle at 80% 20%, var(--${stat.color.replace('text-', '')}) 0%, transparent 50%)`,
                  opacity: 0.05,
                }}
              />
              
              {/* Bottom accent line */}
              <motion.div 
                className={`absolute bottom-0 left-0 h-1 ${stat.bgColor}`}
                initial={{ width: "0%" }}
                whileInView={{ width: "100%" }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 + index * 0.1, duration: 0.6, ease: "easeOut" }}
              />
            </Card>
          </motion.div>
        </motion.div>
      ))}
    </motion.div>
  )
}
