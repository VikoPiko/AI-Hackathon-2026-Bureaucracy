"use client"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export interface Country {
  code: string
  name: string
  flag: string
}

export const COUNTRIES: Country[] = [
  { code: "BG", name: "Bulgaria", flag: "🇧🇬" },
  { code: "DE", name: "Germany", flag: "🇩🇪" },
  { code: "UK", name: "United Kingdom", flag: "🇬🇧" },
  { code: "US", name: "United States", flag: "🇺🇸" },
  { code: "FR", name: "France", flag: "🇫🇷" },
  { code: "ES", name: "Spain", flag: "🇪🇸" },
  { code: "IT", name: "Italy", flag: "🇮🇹" },
  { code: "NL", name: "Netherlands", flag: "🇳🇱" },
  { code: "RO", name: "Romania", flag: "🇷🇴" },
  { code: "GR", name: "Greece", flag: "🇬🇷" },
  { code: "PL", name: "Poland", flag: "🇵🇱" },
  { code: "CZ", name: "Czech Republic", flag: "🇨🇿" },
  { code: "HU", name: "Hungary", flag: "🇭🇺" },
  { code: "AT", name: "Austria", flag: "🇦🇹" },
  { code: "SE", name: "Sweden", flag: "🇸🇪" },
  { code: "DK", name: "Denmark", flag: "🇩🇰" },
  { code: "FI", name: "Finland", flag: "🇫🇮" },
  { code: "NO", name: "Norway", flag: "🇳🇴" },
  { code: "CH", name: "Switzerland", flag: "🇨🇭" },
  { code: "BE", name: "Belgium", flag: "🇧🇪" },
  { code: "PT", name: "Portugal", flag: "🇵🇹" },
  { code: "IE", name: "Ireland", flag: "🇮🇪" },
]

interface CountrySelectorProps {
  value: string
  onChange: (country: string) => void
  disabled?: boolean
}

export function CountrySelector({ value, onChange, disabled }: CountrySelectorProps) {
  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="Select country">
          {value && COUNTRIES.find(c => c.code === value) && (
            <span className="flex items-center gap-2">
              {COUNTRIES.find(c => c.code === value)?.flag} {COUNTRIES.find(c => c.code === value)?.name}
            </span>
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {COUNTRIES.map((country) => (
          <SelectItem key={country.code} value={country.code}>
            <span className="flex items-center gap-2">
              {country.flag} {country.name}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

export function getCountryName(code: string): string {
  return COUNTRIES.find(c => c.code === code)?.name || code
}

export function getCountryFlag(code: string): string {
  return COUNTRIES.find(c => c.code === code)?.flag || ""
}
