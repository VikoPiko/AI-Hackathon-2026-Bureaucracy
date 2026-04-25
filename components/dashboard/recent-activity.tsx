"use client"

import { motion } from "motion/react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowRight, MessageSquare, FileText, CheckCircle2, ExternalLink } from "lucide-react"
import Link from "next/link"
import { useUserActivities } from "@/hooks/use-user-data"

const activityConfig = {
  question: {
    icon: MessageSquare,
    color: "bg-primary/10 text-primary",
    hoverColor: "group-hover:bg-primary/20",
  },
  document: {
    icon: FileText,
    color: "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400",
    hoverColor: "group-hover:bg-amber-200 dark:group-hover:bg-amber-900/50",
  },
  completed: {
    icon: CheckCircle2,
    color: "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400",
    hoverColor: "group-hover:bg-green-200 dark:group-hover:bg-green-900/50",
  },
}

export function RecentActivity() {
  const { activities, isLoaded } = useUserActivities()

  if (!isLoaded) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex gap-4">
                <div className="h-10 w-10 rounded-full bg-muted animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-3/4 rounded bg-muted animate-pulse" />
                  <div className="h-3 w-1/2 rounded bg-muted animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Recent Activity</CardTitle>
        <Button variant="ghost" size="sm" asChild className="gap-1 group">
          <Link href="/history">
            View all
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No recent activity</p>
            <Button asChild className="mt-4">
              <Link href="/ask">Get started</Link>
            </Button>
          </div>
        ) : (
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-5 top-2 bottom-2 w-0.5 bg-gradient-to-b from-border via-border to-transparent" />
            
            <div className="space-y-4">
              {activities.map((activity, index) => {
                const config = activityConfig[activity.type]
                const Icon = config.icon
                
                return (
                  <motion.div
                    key={activity.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.08 }}
                    whileHover={{ x: 4 }}
                    className="relative flex gap-4 pl-12 group cursor-pointer"
                  >
                    {/* Activity icon */}
                    <motion.div 
                      className={`absolute left-0 flex h-10 w-10 items-center justify-center rounded-full transition-colors duration-300 ${config.color} ${config.hoverColor}`}
                      whileHover={{ scale: 1.1 }}
                      transition={{ type: "spring", stiffness: 400, damping: 17 }}
                    >
                      <Icon className="h-5 w-5" />
                    </motion.div>
                    
                    <div className="flex-1 min-w-0 py-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-medium group-hover:text-primary transition-colors">
                          {activity.title}
                        </p>
                        {activity.link && (
                          <motion.div
                            initial={{ opacity: 0 }}
                            whileHover={{ opacity: 1 }}
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <ExternalLink className="h-4 w-4 text-muted-foreground" />
                          </motion.div>
                        )}
                      </div>
                      {activity.preview && (
                        <p className="text-sm text-muted-foreground mt-0.5 truncate">
                          {activity.preview}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        {activity.timestamp}
                      </p>
                    </div>
                  </motion.div>
                )
              })}
            </div>
            
            {/* Fade out gradient at bottom */}
            <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-card to-transparent pointer-events-none" />
          </div>
        )}
      </CardContent>
    </Card>
  )
}
