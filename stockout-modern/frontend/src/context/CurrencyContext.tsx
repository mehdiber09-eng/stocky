import React, { createContext, useContext, useState } from 'react'

export type Currency = 'DZD' | 'EUR' | 'USD'

export const CURRENCY_SYMBOLS: Record<Currency, string> = {
  DZD: 'DA',
  EUR: '€',
  USD: '$',
}

interface CurrencyContextType {
  currency: Currency
  setCurrency: (c: Currency) => void
  symbol: string
  formatPrice: (amount: number) => string
}

const CurrencyContext = createContext<CurrencyContextType>({
  currency: 'DZD',
  setCurrency: () => {},
  symbol: 'DA',
  formatPrice: (n) => `${Math.round(n).toLocaleString('fr-DZ')} DA`,
})

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrencyState] = useState<Currency>(
    () => (localStorage.getItem('app_currency') as Currency) || 'DZD'
  )

  function setCurrency(c: Currency) {
    setCurrencyState(c)
    localStorage.setItem('app_currency', c)
  }

  function formatPrice(amount: number): string {
    if (currency === 'DZD') return `${Math.round(amount).toLocaleString('fr-DZ')} DA`
    if (currency === 'EUR') return `${amount.toFixed(2)} €`
    return `$${amount.toFixed(2)}`
  }

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, symbol: CURRENCY_SYMBOLS[currency], formatPrice }}>
      {children}
    </CurrencyContext.Provider>
  )
}

export const useCurrency = () => useContext(CurrencyContext)
