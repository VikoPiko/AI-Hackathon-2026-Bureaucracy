"use client"

import { motion } from "motion/react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, ArrowRight, Calendar, Flame, Sparkles } from "lucide-react"
import Link from "next/link"
import { useUserPriorities } from "@/hooks/use-user-data"

type Urgency = "critical" | "high" | "soon"

const urgencyConfig: Record<
  Urgency,
  { label: string; icon: typeof Flame; pill: string; dot: string }
> = {
  critical: {
    label: "Critical",
    icon: Flame,
    pill: "bg-destructive/10 text-destructive border-destructive/30",
    dot: "bg-destructive",
  },
  high: {
    label: "Soon",
    icon: AlertTriangle,
    pill: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border-amber-300 dark:border-amber-700",
    dot: "bg-amber-500",
  },
  soon: {
    label: "Upcoming",
    icon: Calendar,
    pill: "bg-secondary text-secondary-foreground border-border",
    dot: "bg-muted-foreground",
  },
}

export function TodayPriorities() {
  const { priorities, isLoaded } = useUserPriorities()

  if (!isLoaded) {
    return (
      <Card className="overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary animate-pulse">
              <Flame className="h-4 w-4" />
            </div>
            <CardTitle className="text-base">Today&apos;s priorities</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 rounded-lg bg-muted animate-pulse" />
          ))}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary">
            <Flame className="h-4 w-4" />
          </div>
          <CardTitle className="text-base">Today&apos;s priorities</CardTitle>
        </div>
        <Button variant="ghost" size="sm" asChild className="gap-1 group">
          <Link href="/ask">
            <Sparkles className="h-3.5 w-3.5" />
            Plan with AI
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent className="space-y-2">
        {priorities.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No priorities set</p>
            <Button asChild className="mt-4">
              <Link href="/ask">Get started with AI</Link>
            </Button>
          </div>
        ) : (
          priorities.map((p, i) => {
            const cfg = urgencyConfig[p.urgency]
            const Icon = cfg.icon
            return (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Link
                  href={p.href}
                  className="group flex items-center gap-3 rounded-lg border border-border bg-card p-3 transition-all hover:border-primary/30 hover:shadow-sm"
                >
                  <span
                    className={`relative flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border ${cfg.pill}`}
                  >
                    <Icon className="h-4 w-4" />
                    {p.urgency === "critical" && (
                      <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-destructive ring-2 ring-card animate-pulse" />
                    )}
                  </span>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-sm truncate">{p.title}</p>
                      <Badge variant="outline" className={`text-[10px] ${cfg.pill}`}>
                        {cfg.label}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">
                      {p.process} · due {p.due}
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold tabular-nums">
                      {p.daysLeft}
                      <span className="ml-0.5 text-xs font-normal text-muted-foreground">d</span>
                    </p>
                    <p className="text-[10px] text-muted-foreground">left</p>
                  </div>

                  <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100" />
                </Link>
              </motion.div>
            )
          })
        )}
      </CardContent>
    </Card>
  )
}
