import React, { createContext, useContext, useState } from 'react'

export type Currency = 'EUR' | 'USD' | 'AED' | 'SAR'

export const CURRENCY_SYMBOLS: Record<Currency, string> = {
  EUR: '€',
  USD: '$',
  AED: 'AED',
  SAR: 'SAR',
}

// Taux approximatifs vers DZD (base: 1 unité = X DZD)
export const TO_DZD: Record<Currency, number> = {
  EUR: 149.25,
  USD: 135.14,
  AED: 36.79,
  SAR: 36.04,
}

interface CurrencyContextType {
  currency: Currency
  setCurrency: (c: Currency) => void
  symbol: string
  formatPrice: (amountDZD: number) => string
  convertFromDZD: (amountDZD: number) => number
  convertToDZD: (amount: number, fromCurrency: Currency) => number
}

const CurrencyContext = createContext<CurrencyContextType>({
  currency: 'EUR',
  setCurrency: () => {},
  symbol: '€',
  formatPrice: (n) => `${(n/TO_DZD.EUR).toFixed(2)} €`,
  convertFromDZD: (n) => n / TO_DZD.EUR,
  convertToDZD: (n) => n * TO_DZD.EUR,
})

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrencyState] = useState<Currency>(
    () => (localStorage.getItem('app_currency') as Currency) || 'EUR'
  )

  function setCurrency(c: Currency) {
    setCurrencyState(c)
    localStorage.setItem('app_currency', c)
  }

  function convertFromDZD(amountDZD: number): number {
    return amountDZD / TO_DZD[currency]
  }

  function convertToDZD(amount: number, fromCurrency: Currency): number {
    return amount * TO_DZD[fromCurrency]
  }

  function formatPrice(amountDZD: number): string {
    const converted = convertFromDZD(amountDZD)
    if (currency === 'EUR') return `${converted.toFixed(2)} €`
    if (currency === 'AED') return `${converted.toFixed(2)} AED`
    if (currency === 'SAR') return `${converted.toFixed(2)} SAR`
    return `$${converted.toFixed(2)}`
  }

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, symbol: CURRENCY_SYMBOLS[currency], formatPrice, convertFromDZD, convertToDZD }}>
      {children}
    </CurrencyContext.Provider>
  )
}

export const useCurrency = () => useContext(CurrencyContext)
