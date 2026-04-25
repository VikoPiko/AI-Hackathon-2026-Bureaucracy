"use client"

import Link from "next/link"
import { motion } from "motion/react"
import { Button } from "@/components/ui/button"
import { LanguagePicker } from "@/components/language-picker"
import { ThemePicker } from "@/components/ui/theme-picker"
import { useAuth } from "@/lib/auth/context"
import { useI18n } from "@/lib/i18n-context"
import { FileText } from "lucide-react"

export function Header() {
  const { user, isLoading } = useAuth()
  const { translate: tr } = useI18n()

  return (
    <motion.header 
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="fixed top-0 left-0 right-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-lg"
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground transition-transform group-hover:scale-105">
            <FileText className="h-5 w-5" />
          </div>
          <span className="text-xl font-semibold tracking-tight">FormWise</span>
        </Link>

        <div className="flex items-center gap-2 sm:gap-4">
          <ThemePicker />
          <LanguagePicker />
          
          {!isLoading && (
            <>
              {user ? (
                <Button asChild size="sm">
                  <Link href="/dashboard">{tr("header.dashboard")}</Link>
                </Button>
              ) : (
                <>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href="/login">{tr("header.login")}</Link>
                  </Button>
                  <Button size="sm" asChild>
                    <Link href="/register">{tr("header.getStarted")}</Link>
                  </Button>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </motion.header>
  )
}
