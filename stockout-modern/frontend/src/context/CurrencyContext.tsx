import React, { createContext, useContext, useState } from 'react'

export type Currency = 'DZD' | 'EUR' | 'USD' | 'AED' | 'SAR'

export const CURRENCY_SYMBOLS: Record<Currency, string> = {
  DZD: 'DA',
  EUR: '€',
  USD: '$',
  AED: 'AED',
  SAR: 'SAR',
}

// Taux approximatifs vers DZD (base: 1 unité = X DZD)
export const TO_DZD: Record<Currency, number> = {
  DZD: 1,
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
  currency: 'DZD',
  setCurrency: () => {},
  symbol: 'DA',
  formatPrice: (n) => `${Math.round(n).toLocaleString('fr-DZ')} DA`,
  convertFromDZD: (n) => n,
  convertToDZD: (n) => n,
})

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrencyState] = useState<Currency>(
    () => (localStorage.getItem('app_currency') as Currency) || 'DZD'
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
    if (currency === 'DZD') return `${Math.round(converted).toLocaleString('fr-DZ')} DA`
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
