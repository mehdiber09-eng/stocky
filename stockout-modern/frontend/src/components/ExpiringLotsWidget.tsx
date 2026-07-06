import React, { useEffect, useState } from 'react'
import { AlertTriangle, ChevronRight } from 'lucide-react'
import { LotsAPI, Lot } from '../api/api'
import { Link } from 'react-router-dom'

interface ExpiryWidgetProps {
  limit?: number
}

export function ExpiringLotsWidget({ limit = 5 }: ExpiryWidgetProps) {
  const [lots, setLots] = useState<Lot[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [criticalCount, setCriticalCount] = useState(0)

  useEffect(() => {
    loadExpiringLots()
  }, [])

  const loadExpiringLots = async () => {
    try {
      setLoading(false)
      setError(null)
      const response = await LotsAPI.expiring(30, limit)
      const lotsData = response.data || []

      const now = new Date()
      let critical = 0

      lotsData.forEach((lot) => {
        const expiryDate = lot.expiry_date ? new Date(lot.expiry_date) : null
        if (expiryDate) {
          const days = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
          if (days <= 7) critical++
        }
      })

      setCriticalCount(critical)
      setLots(lotsData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur')
      console.error('Error loading expiring lots:', err)
    } finally {
      setLoading(false)
    }
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-sm text-red-800">Erreur: {error}</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="p-4 text-center text-gray-500">
        Chargement...
      </div>
    )
  }

  if (lots.length === 0) {
    return (
      <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
        <p className="text-sm text-green-800">✓ Aucun lot expirant dans les 30 jours</p>
      </div>
    )
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <div className={`p-4 ${criticalCount > 0 ? 'bg-red-50' : 'bg-yellow-50'}`}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold flex items-center gap-2">
            <AlertTriangle size={18} className={criticalCount > 0 ? 'text-red-600' : 'text-yellow-600'} />
            Lots à écouler
          </h3>
          {criticalCount > 0 && (
            <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-bold rounded">
              {criticalCount} critiques
            </span>
          )}
        </div>

        <div className="space-y-2">
          {lots.slice(0, limit).map((lot) => {
            const expiryDate = lot.expiry_date ? new Date(lot.expiry_date) : null
            const now = new Date()
            const daysUntil = expiryDate
              ? Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
              : 999

            const isCritical = daysUntil <= 7
            const isExpired = daysUntil < 0

            return (
              <div
                key={lot.id}
                className={`p-2 rounded text-sm ${
                  isExpired
                    ? 'bg-red-100 text-red-900'
                    : isCritical
                    ? 'bg-yellow-100 text-yellow-900'
                    : 'bg-white border border-gray-200'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium">Produit #{lot.product_id}</p>
                    <p className="text-xs opacity-75">
                      Qté: {lot.quantity_available}/{lot.quantity_total}
                    </p>
                  </div>
                  <span className={`text-xs font-bold ${
                    isExpired ? 'text-red-600' : isCritical ? 'text-yellow-600' : 'text-gray-600'
                  }`}>
                    {isExpired ? 'EXPIRÉ' : `${daysUntil}j`}
                  </span>
                </div>
              </div>
            )
          })}
        </div>

        {lots.length > limit && (
          <Link
            to="/expiring-products"
            className="mt-3 block p-2 text-sm text-center bg-white border border-gray-200 rounded hover:bg-gray-50 transition text-blue-600 font-medium flex items-center justify-center gap-1"
          >
            Voir tous ({lots.length} lots)
            <ChevronRight size={16} />
          </Link>
        )}
      </div>
    </div>
  )
}
