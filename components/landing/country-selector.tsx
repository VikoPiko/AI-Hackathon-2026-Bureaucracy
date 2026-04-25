"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ChevronDown, Globe } from "lucide-react"

const countries = [
  { code: "BG", name: "Bulgaria", flag: "🇧🇬" },
  { code: "DE", name: "Germany", flag: "🇩🇪" },
  { code: "FR", name: "France", flag: "🇫🇷" },
  { code: "ES", name: "Spain", flag: "🇪🇸" },
  { code: "IT", name: "Italy", flag: "🇮🇹" },
  { code: "NL", name: "Netherlands", flag: "🇳🇱" },
  { code: "PT", name: "Portugal", flag: "🇵🇹" },
  { code: "US", name: "United States", flag: "🇺🇸" },
  { code: "UK", name: "United Kingdom", flag: "🇬🇧" },
]

interface CountrySelectorProps {
  value?: string
  onChange?: (code: string) => void
}

export function CountrySelector({ value, onChange }: CountrySelectorProps) {
  const [selected, setSelected] = useState(value || "BG")
  
  const selectedCountry = countries.find(c => c.code === selected)
  
  const handleSelect = (code: string) => {
    setSelected(code)
    onChange?.(code)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2 text-sm">
          <Globe className="h-4 w-4" />
          <span className="hidden sm:inline">{selectedCountry?.name}</span>
          <span className="sm:hidden">{selectedCountry?.code}</span>
          <ChevronDown className="h-3 w-3 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {countries.map((country) => (
          <DropdownMenuItem
            key={country.code}
            onClick={() => handleSelect(country.code)}
            className="gap-2 cursor-pointer"
          >
            <span>{country.flag}</span>
            <span>{country.name}</span>
            {country.code === selected && (
              <span className="ml-auto text-primary">&#10003;</span>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
