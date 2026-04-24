"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "motion/react"
import { useAuth } from "@/lib/auth/context"
import { StatsOverview } from "@/components/dashboard/stats-overview"
import { OngoingProcesses } from "@/components/dashboard/ongoing-processes"
import { RecentActivity } from "@/components/dashboard/recent-activity"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowRight, Sparkles, X, MessageSquare, FileText, FolderOpen, HelpCircle } from "lucide-react"
import Link from "next/link"

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
    color: "bg-amber-100 text-amber-600 hover:bg-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:hover:bg-amber-900/50",
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
    color: "bg-green-100 text-green-600 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-900/50",
  },
]

export default function DashboardPage() {
  const { user } = useAuth()
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
    if (hour < 12) return "Good morning"
    if (hour < 18) return "Good afternoon"
    return "Good evening"
  }

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {greeting()}, {user?.name?.split(" ")[0]}
          </h1>
          <p className="text-muted-foreground mt-1">
            Here&apos;s an overview of your bureaucratic journey.
          </p>
        </div>
        <Button asChild className="gap-2 w-fit group shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-shadow">
          <Link href="/ask">
            <Sparkles className="h-4 w-4" />
            New Question
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </Button>
      </motion.div>

      {/* Stats Overview */}
      <StatsOverview />

      {/* First Visit Welcome Card */}
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
                    Welcome to FormWise!
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Ask our AI assistant about any bureaucratic process and get step-by-step guidance.
                  </p>
                </div>
                <Button asChild className="gap-2 shrink-0 group">
                  <Link href="/ask">
                    Get Started
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
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
                    <div className={`h-10 w-10 rounded-lg flex items-center justify-center transition-colors ${action.color}`}>
                      <action.icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium group-hover:text-primary transition-colors">{action.title}</p>
                      <p className="text-sm text-muted-foreground mt-0.5">{action.description}</p>
                    </div>
                  </div>
                </motion.div>
              </Link>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Main Content Grid */}
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
