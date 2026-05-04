import React, { useState, useEffect } from 'react'
import { Package, X, Check, Loader2, Truck, AlertTriangle } from 'lucide-react'
import { ProductsAPI, SuppliersAPI, Product, Supplier } from '../api/api'

interface Props {
  product: Product
  onClose: () => void
  onSaved: (updated: Product) => void
}

export default function EditProductModal({ product, onClose, onSaved }: Props) {
  const [name, setName] = useState(product.name)
  const [leadTime, setLeadTime] = useState(product.lead_time_days)
  const [safetyStock, setSafetyStock] = useState(product.safety_stock)
  const [supplierId, setSupplierId] = useState<number | null>(product.supplier_id ?? null)
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [suppliersLoading, setSuppliersLoading] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setSuppliersLoading(true)
    SuppliersAPI.list()
      .then(res => setSuppliers(res.data))
      .catch(() => {/* ignore */})
      .finally(() => setSuppliersLoading(false))
  }, [])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const res = await ProductsAPI.update(product.id, {
        name: name.trim(),
        lead_time_days: leadTime,
        safety_stock: safetyStock,
        supplier_id: supplierId,
      })
      onSaved(res.data)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Erreur lors de la mise à jour')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md card animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-brand-500/10 flex items-center justify-center text-brand-400">
              <Package size={18} />
            </div>
            <div>
              <h2 className="font-semibold text-zinc-100">Modifier le produit</h2>
              <code className="text-xs text-zinc-500 font-mono">{product.sku}</code>
            </div>
          </div>
          <button onClick={onClose} className="btn-ghost p-1.5 rounded-lg">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={submit} className="space-y-4">
          {/* Name */}
          <div>
            <label className="label">Nom du produit</label>
            <input
              className="input"
              value={name}
              onChange={e => setName(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Lead time */}
            <div>
              <label className="label">Délai livraison <span className="text-zinc-600">(j)</span></label>
              <input
                type="number"
                className="input"
                min={0}
                value={leadTime}
                onChange={e => setLeadTime(Number(e.target.value))}
              />
            </div>

            {/* Safety stock */}
            <div>
              <label className="label">Stock sécurité <span className="text-zinc-600">(unités)</span></label>
              <input
                type="number"
                className="input"
                min={0}
                value={safetyStock}
                onChange={e => setSafetyStock(Number(e.target.value))}
              />
            </div>
          </div>

          {/* Supplier */}
          <div>
            <label className="label flex items-center gap-1.5">
              <Truck size={12} className="text-zinc-500" />
              Fournisseur
              <span className="text-zinc-600 font-normal">(optionnel)</span>
            </label>
            {suppliersLoading ? (
              <div className="input flex items-center gap-2 text-zinc-500">
                <Loader2 size={13} className="animate-spin" />
                <span className="text-sm">Chargement...</span>
              </div>
            ) : (
              <select
                className="input"
                value={supplierId ?? ''}
                onChange={e => setSupplierId(e.target.value ? Number(e.target.value) : null)}
              >
                <option value="">— Aucun fournisseur —</option>
                {suppliers.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.lead_time_days}j)
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* SKU info (read-only) */}
          <div className="glass-subtle rounded-xl px-3 py-2.5 flex items-center gap-2">
            <span className="text-xs text-zinc-600">SKU :</span>
            <code className="text-xs text-zinc-400 font-mono">{product.sku}</code>
            <span className="text-xs text-zinc-600 ml-auto">non modifiable</span>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2.5">
              <AlertTriangle size={14} />
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3 pt-1">
            <button type="submit" className="btn-primary flex items-center gap-2" disabled={loading}>
              {loading ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
              Enregistrer
            </button>
            <button type="button" className="btn-ghost text-sm" onClick={onClose}>
              Annuler
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
