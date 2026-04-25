"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command"
import { useAuth } from "@/lib/auth/context"
import { useTheme } from "@/lib/theme/context"
import { categories } from "@/components/app/browse-categories"
import {
  ArrowRight,
  FileText,
  FolderOpen,
  History,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  Moon,
  Palette,
  Sparkles,
  Sun,
} from "lucide-react"

type CommandPaletteContextValue = {
  open: boolean
  setOpen: (open: boolean) => void
  toggle: () => void
}

const CommandPaletteContext = createContext<CommandPaletteContextValue | null>(null)

export function useCommandPalette() {
  const ctx = useContext(CommandPaletteContext)
  if (!ctx) {
    throw new Error("useCommandPalette must be used within CommandPaletteProvider")
  }
  return ctx
}

const quickAsks = [
  "How do I get a residence permit?",
  "What documents do I need to register a company?",
  "How to renew my passport?",
  "What's the process for getting a driver's license?",
]

const countries = [
  { code: "BG", name: "Bulgaria", flag: "\u{1F1E7}\u{1F1EC}" },
  { code: "DE", name: "Germany", flag: "\u{1F1E9}\u{1F1EA}" },
  { code: "NL", name: "Netherlands", flag: "\u{1F1F3}\u{1F1F1}" },
  { code: "PT", name: "Portugal", flag: "\u{1F1F5}\u{1F1F9}" },
  { code: "ES", name: "Spain", flag: "\u{1F1EA}\u{1F1F8}" },
  { code: "FR", name: "France", flag: "\u{1F1EB}\u{1F1F7}" },
  { code: "PL", name: "Poland", flag: "\u{1F1F5}\u{1F1F1}" },
  { code: "AT", name: "Austria", flag: "\u{1F1E6}\u{1F1F9}" },
]

export function CommandPaletteProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  const { logout } = useAuth()
  const { mode, setMode, setPreset } = useTheme()
  const [open, setOpen] = useState(false)

  const toggle = useCallback(() => setOpen((o) => !o), [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault()
        setOpen((o) => !o)
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  const value = useMemo(() => ({ open, setOpen, toggle }), [open, toggle])

  const run = (fn: () => void) => {
    setOpen(false)
    requestAnimationFrame(fn)
  }

  const goToAsk = (question?: string) => {
    if (question) {
      router.push(`/ask?q=${encodeURIComponent(question)}`)
    } else {
      router.push("/ask")
    }
  }

  const goToCategory = (categoryId: string) => {
    router.push(`/browse?category=${encodeURIComponent(categoryId)}`)
  }

  const setCountry = (code: string) => {
    try {
      localStorage.setItem("formwise-country", code)
      window.dispatchEvent(new CustomEvent("formwise:country-changed", { detail: code }))
    } catch {}
  }

  return (
    <CommandPaletteContext.Provider value={value}>
      {children}
      <CommandDialog
        open={open}
        onOpenChange={setOpen}
        title="FormWise Command Palette"
        description="Search procedures, jump pages, switch country, ask AI."
        className="max-w-xl"
      >
        <CommandInput placeholder="Type a command, search a procedure, or ask AI..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>

          <CommandGroup heading="Navigation">
            <CommandItem onSelect={() => run(() => router.push("/dashboard"))}>
              <LayoutDashboard />
              Dashboard
              <CommandShortcut>G D</CommandShortcut>
            </CommandItem>
            <CommandItem onSelect={() => run(() => router.push("/ask"))}>
              <MessageSquare />
              Ask FormWise
              <CommandShortcut>G A</CommandShortcut>
            </CommandItem>
            <CommandItem onSelect={() => run(() => router.push("/browse"))}>
              <FolderOpen />
              Browse Procedures
              <CommandShortcut>G B</CommandShortcut>
            </CommandItem>
            <CommandItem onSelect={() => run(() => router.push("/history"))}>
              <History />
              History
              <CommandShortcut>G H</CommandShortcut>
            </CommandItem>
          </CommandGroup>

          <CommandSeparator />

          <CommandGroup heading="Quick Ask">
            {quickAsks.map((q) => (
              <CommandItem key={q} value={`ask ${q}`} onSelect={() => run(() => goToAsk(q))}>
                <Sparkles className="text-primary" />
                <span className="truncate">{q}</span>
                <ArrowRight className="ml-auto opacity-60" />
              </CommandItem>
            ))}
          </CommandGroup>

          <CommandSeparator />

          <CommandGroup heading="Procedure Categories">
            {categories.map((c) => (
              <CommandItem
                key={c.id}
                value={`category ${c.name} ${c.description}`}
                onSelect={() => run(() => goToCategory(c.id))}
              >
                <c.icon />
                {c.name}
                <span className="ml-auto text-xs text-muted-foreground">
                  {c.procedureCount} procedures
                </span>
              </CommandItem>
            ))}
          </CommandGroup>

          <CommandSeparator />

          <CommandGroup heading="Switch Country">
            {countries.map((c) => (
              <CommandItem
                key={c.code}
                value={`country ${c.name} ${c.code}`}
                onSelect={() => run(() => setCountry(c.code))}
              >
                <span className="text-base leading-none">{c.flag}</span>
                {c.name}
                <span className="ml-auto text-xs text-muted-foreground">{c.code}</span>
              </CommandItem>
            ))}
          </CommandGroup>

          <CommandSeparator />

          <CommandGroup heading="Appearance">
            <CommandItem
              onSelect={() => run(() => setMode(mode === "dark" ? "light" : "dark"))}
            >
              {mode === "dark" ? <Sun /> : <Moon />}
              {mode === "dark" ? "Switch to Light" : "Switch to Dark"}
            </CommandItem>
            <CommandItem onSelect={() => run(() => setPreset("warm"))}>
              <Palette className="text-primary" />
              Warm theme
            </CommandItem>
            <CommandItem onSelect={() => run(() => setPreset("fresh"))}>
              <Palette className="text-accent" />
              Fresh theme
            </CommandItem>
          </CommandGroup>

          <CommandSeparator />

          <CommandGroup heading="Account">
            <CommandItem
              onSelect={() => run(() => { logout(); router.push("/") })}
              className="text-destructive data-[selected=true]:bg-destructive/10 data-[selected=true]:text-destructive"
            >
              <LogOut />
              Log out
            </CommandItem>
          </CommandGroup>
        </CommandList>

        <div className="flex items-center justify-between border-t border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <FileText className="h-3.5 w-3.5" />
            <span>FormWise · Bureaucracy AI</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden sm:inline">Navigate</span>
            <kbd className="rounded bg-background px-1.5 py-0.5 border border-border text-[10px]">
              ↑↓
            </kbd>
            <span className="hidden sm:inline">Open</span>
            <kbd className="rounded bg-background px-1.5 py-0.5 border border-border text-[10px]">
              ↵
            </kbd>
            <span className="hidden sm:inline">Close</span>
            <kbd className="rounded bg-background px-1.5 py-0.5 border border-border text-[10px]">
              Esc
            </kbd>
          </div>
        </div>
      </CommandDialog>
    </CommandPaletteContext.Provider>
  )
}
