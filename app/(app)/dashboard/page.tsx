"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "motion/react"
import { useAuth } from "@/lib/auth/context"
import { StatsOverview } from "@/components/dashboard/stats-overview"
import { OngoingProcesses } from "@/components/dashboard/ongoing-processes"
import { RecentActivity } from "@/components/dashboard/recent-activity"
import { TodayPriorities } from "@/components/dashboard/today-priorities"
import { ActivityChart } from "@/components/dashboard/activity-chart"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Kbd } from "@/components/ui/kbd"
import {
  ArrowRight,
  Sparkles,
  X,
  MessageSquare,
  FileText,
  FolderOpen,
  HelpCircle,
} from "lucide-react"
import Link from "next/link"
import { useCommandPalette } from "@/components/app/command-palette"
import { useI18n } from "@/lib/i18n-context"

export default function DashboardPage() {
  const { user } = useAuth()
  const { translate: tr } = useI18n()
  const { setOpen: openCommandPalette } = useCommandPalette()
  const [showWelcomeCard, setShowWelcomeCard] = useState(false)
  const [isFirstVisit, setIsFirstVisit] = useState(true)

  useEffect(() => {
    const hasVisited = localStorage.getItem("formwise-dashboard-visited")
    if (!hasVisited) {
      setShowWelcomeCard(true)
      setIsFirstVisit(true)
    } else {
      setIsFirstVisit(false)
    }
  }, [])

  const dismissWelcomeCard = () => {
    setShowWelcomeCard(false)
    localStorage.setItem("formwise-dashboard-visited", "true")
  }

  const greeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return tr("dashboard.morning")
    if (hour < 18) return tr("dashboard.afternoon")
    return tr("dashboard.evening")
  }

  const quickActions = [
    {
      title: "Ask a Question",
      description: "Get instant answers about any procedure",
      icon: MessageSquare,
      href: "/ask",
      color: "bg-primary/10 text-primary hover:bg-primary/20",
    },
    {
      title: "Upload Document",
      description: "Analyze documents for guidance",
      icon: FileText,
      href: "/ask",
      color:
        "bg-amber-100 text-amber-600 hover:bg-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:hover:bg-amber-900/50",
    },
    {
      title: "Browse Guides",
      description: "Explore procedure categories",
      icon: FolderOpen,
      href: "/browse",
      color: "bg-accent/10 text-accent hover:bg-accent/20",
    },
    {
      title: "Get Help",
      description: "Tips and support resources",
      icon: HelpCircle,
      href: "/help",
      color:
        "bg-green-100 text-green-600 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-900/50",
    },
  ]

  const summaryParts = tr("dashboard.summary", { shortcut: "⌘K" }).split("⌘K")

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-primary/[0.04] via-background to-accent/[0.05] px-5 py-6 sm:px-7 sm:py-8"
      >
        <div className="pointer-events-none absolute -top-16 -right-16 h-56 w-56 rounded-full bg-primary/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 left-10 h-48 w-48 rounded-full bg-accent/10 blur-3xl" />

        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background/60 px-2.5 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
              <Sparkles className="h-3 w-3 text-accent" />
              <span>{tr("dashboard.badge")}</span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              {greeting()},{" "}
              <span className="bg-gradient-to-br from-primary to-accent bg-clip-text text-transparent">
                {user?.name?.split(" ")[0] || tr("dashboard.friend")}
              </span>
            </h1>
            <p className="text-muted-foreground max-w-xl">
              {summaryParts[0]}
              <Kbd className="bg-background/80 border border-border">⌘K</Kbd>
              {summaryParts[1] ?? ""}
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:items-end">
            <Button
              asChild
              className="gap-2 group shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-shadow"
            >
              <Link href="/ask">
                <Sparkles className="h-4 w-4" />
                {tr("dashboard.newQuestion")}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
            <button
              type="button"
              onClick={() => openCommandPalette(true)}
              className="text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              {tr("dashboard.openPalette")}
            </button>
          </div>
        </div>
      </motion.div>

      <StatsOverview />

      <AnimatePresence>
        {showWelcomeCard && isFirstVisit && (
          <motion.div
            initial={{ opacity: 0, y: 20, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -10, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-accent/5 to-transparent border-primary/20">
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-3 right-3 h-8 w-8 rounded-full hover:bg-destructive/10 hover:text-destructive transition-colors"
                onClick={dismissWelcomeCard}
              >
                <X className="h-4 w-4" />
              </Button>
              <CardContent className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 py-6 pr-12">
                <div className="space-y-1">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-accent" />
                    {tr("dashboard.welcomeTitle")}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {tr("dashboard.welcomeBody")}
                  </p>
                </div>
                <Button asChild className="gap-2 shrink-0 group">
                  <Link href="/ask">
                    {tr("dashboard.welcomeAction")}
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid gap-6 lg:grid-cols-5"
      >
        <div className="lg:col-span-3">
          <TodayPriorities />
        </div>
        <div className="lg:col-span-2">
          <ActivityChart />
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        <h2 className="text-lg font-semibold mb-4">{tr("dashboard.quickActions")}</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {quickActions.map((action, index) => (
            <motion.div
              key={action.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + index * 0.05 }}
            >
              <Link href={action.href}>
                <motion.div
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  className="p-4 rounded-xl border border-border bg-card hover:border-primary/30 hover:shadow-md transition-all duration-300 cursor-pointer group"
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`h-10 w-10 rounded-lg flex items-center justify-center transition-colors ${action.color}`}
                    >
                      <action.icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium group-hover:text-primary transition-colors">
                        {action.title}
                      </p>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {action.description}
                      </p>
                    </div>
                  </div>
                </motion.div>
              </Link>
            </motion.div>
          ))}
        </div>
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <OngoingProcesses />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <RecentActivity />
        </motion.div>
      </div>
    </div>
  )
}
