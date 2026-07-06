import React, { useEffect, useState } from 'react'
import { Trash2, CheckCircle } from 'lucide-react'
import { LotsAPI, Lot } from '../api/api'

export default function ExpiringProducts() {
  const [lots, setLots] = useState<(Lot & { daysUntilExpiry: number })[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filterDays, setFilterDays] = useState<number>(30)
  const [sortBy, setSortBy] = useState<'expiry' | 'urgency'>('urgency')

  useEffect(() => {
    loadExpiringLots()
  }, [filterDays])

  const loadExpiringLots = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await LotsAPI.expiring(filterDays, 100)
      const lotsData = response.data || []

      const now = new Date()
      const enriched = lotsData.map((lot) => {
        const expiryDate = lot.expiry_date ? new Date(lot.expiry_date) : null
        const daysUntilExpiry = expiryDate
          ? Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
          : 999

        return { ...lot, daysUntilExpiry }
      })

      // Sorting
      if (sortBy === 'urgency') {
        enriched.sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry)
      } else {
        enriched.sort((a, b) => {
          const dateA = a.expiry_date ? new Date(a.expiry_date) : new Date(9999, 0)
          const dateB = b.expiry_date ? new Date(b.expiry_date) : new Date(9999, 0)
          return dateA.getTime() - dateB.getTime()
        })
      }

      setLots(enriched)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement')
      console.error('Error loading expiring lots:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleMarkAsConsumed = async (lot: Lot) => {
    try {
      await LotsAPI.update(lot.id, { quantity_available: 0 })
      setLots(lots.filter((l) => l.id !== lot.id))
    } catch (err) {
      console.error('Error updating lot:', err)
    }
  }

  const handleDelete = async (lot: Lot) => {
    if (confirm('Supprimer ce lot ?')) {
      try {
        await LotsAPI.delete(lot.id)
        setLots(lots.filter((l) => l.id !== lot.id))
      } catch (err) {
        console.error('Error deleting lot:', err)
      }
    }
  }

  const getSeverity = (daysUntilExpiry: number): 'critical' | 'warning' | 'ok' => {
    if (daysUntilExpiry <= 3) return 'critical'
    if (daysUntilExpiry <= 7) return 'warning'
    return 'ok'
  }

  const getSeverityColor = (severity: 'critical' | 'warning' | 'ok'): string => {
    if (severity === 'critical') return 'bg-red-50 border-red-200'
    if (severity === 'warning') return 'bg-yellow-50 border-yellow-200'
    return 'bg-blue-50 border-blue-200'
  }

  const getSeverityBadgeColor = (severity: 'critical' | 'warning' | 'ok'): string => {
    if (severity === 'critical') return 'bg-red-100 text-red-800'
    if (severity === 'warning') return 'bg-yellow-100 text-yellow-800'
    return 'bg-blue-100 text-blue-800'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin">⏳</div>
        <span className="ml-2">Chargement...</span>
      </div>
    )
  }

  return (
    <div className="w-full max-w-6xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Produits à écouler</h1>
        <p className="text-gray-600">Lots approchant ou ayant dépassé leur date d'expiration</p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
          {error}
        </div>
      )}

      <div className="flex gap-4 mb-6">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">Horizon:</label>
          <select
            value={filterDays}
            onChange={(e) => setFilterDays(Number(e.target.value))}
            className="px-3 py-1 border rounded-lg"
          >
            <option value={7}>7 jours</option>
            <option value={14}>14 jours</option>
            <option value={30}>30 jours</option>
            <option value={60}>60 jours</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">Trier par:</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'expiry' | 'urgency')}
            className="px-3 py-1 border rounded-lg"
          >
            <option value="urgency">Urgence (plus proche d'abord)</option>
            <option value="expiry">Date d'expiration</option>
          </select>
        </div>
      </div>

      {lots.length === 0 ? (
        <div className="p-8 bg-green-50 border border-green-200 rounded-lg text-center text-green-800">
          ✓ Aucun lot à écouler dans les {filterDays} prochains jours
        </div>
      ) : (
        <div className="space-y-3">
          {lots.map((lot) => {
            const severity = getSeverity(lot.daysUntilExpiry)
            const expiryDate = lot.expiry_date ? new Date(lot.expiry_date) : null

            return (
              <div
                key={lot.id}
                className={`p-4 border rounded-lg ${getSeverityColor(severity)}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getSeverityBadgeColor(severity)}`}>
                        {lot.daysUntilExpiry <= 0
                          ? '🚨 EXPIRÉ'
                          : `${lot.daysUntilExpiry}j restants`}
                      </span>
                      {lot.batch_code && (
                        <span className="text-xs text-gray-600">Lot: {lot.batch_code}</span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-lg">{lot.product?.name || `Produit #${lot.product_id}`}</h3>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Quantité disponible:</span>
                        <span className="ml-2 font-medium">{lot.quantity_available} / {lot.quantity_total}</span>
                      </div>
                      {expiryDate && (
                        <div>
                          <span className="text-gray-600">Expiration:</span>
                          <span className="ml-2 font-medium">{expiryDate.toLocaleDateString('fr-FR')}</span>
                        </div>
                      )}
                      {lot.received_at && (
                        <div>
                          <span className="text-gray-600">Reçu le:</span>
                          <span className="ml-2 font-medium">
                            {new Date(lot.received_at).toLocaleDateString('fr-FR')}
                          </span>
                        </div>
                      )}
                      {lot.supplier_lot_ref && (
                        <div>
                          <span className="text-gray-600">Ref fournisseur:</span>
                          <span className="ml-2 font-medium">{lot.supplier_lot_ref}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => handleMarkAsConsumed(lot)}
                      className="p-2 hover:bg-green-100 rounded transition"
                      title="Marquer comme écoulé"
                    >
                      <CheckCircle size={20} className="text-green-600" />
                    </button>
                    <button
                      onClick={() => handleDelete(lot)}
                      className="p-2 hover:bg-red-100 rounded transition"
                      title="Supprimer"
                    >
                      <Trash2 size={20} className="text-red-600" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-gray-700">
          <strong>Conseil:</strong> Marquez les lots comme écoulés une fois vendus ou détruits. 
          Supprimez les lots enregistrés par erreur.
        </p>
      </div>
    </div>
  )
}
