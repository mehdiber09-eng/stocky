import React, { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Package, Loader2, Truck } from 'lucide-react'
import { ProductsAPI, SuppliersAPI, Supplier } from '../api/api'
import Toast from '../components/Toast'

export default function CreateProduct() {
  const [name, setName] = useState('')
  const [sku, setSku] = useState('')
  const [leadTime, setLeadTime] = useState(7)
  const [safetyStock, setSafetyStock] = useState(0)
  const [initialStock, setInitialStock] = useState(0)
  const [supplierId, setSupplierId] = useState<number | null>(null)
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [suppliersLoading, setSuppliersLoading] = useState(false)
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    setSuppliersLoading(true)
    SuppliersAPI.list()
      .then(res => setSuppliers(res.data))
      .catch(() => {/* ignore — field just stays empty */})
      .finally(() => setSuppliersLoading(false))
  }, [])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      await ProductsAPI.create({
        name, sku,
        lead_time_days: leadTime,
        safety_stock: safetyStock,
        initial_stock: initialStock,
        supplier_id: supplierId,
      })
      setToast({ msg: 'Produit créé avec succès !', type: 'success' })
      setTimeout(() => navigate('/dashboard'), 800)
    } catch (err: any) {
      setToast({ msg: err.response?.data?.detail || 'Erreur lors de la création', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="animate-fade-in max-w-xl">
      <Link to="/" className="flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-300 mb-6 transition-colors">
        <ArrowLeft size={14} /> Retour au dashboard
      </Link>

      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-brand-500/10 flex items-center justify-center text-brand-400">
          <Package size={20} />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-zinc-100">Nouveau produit</h1>
          <p className="text-sm text-zinc-500">Ajoutez un produit à votre catalogue</p>
        </div>
      </div>

      <div className="card">
        <form onSubmit={submit} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="label">Nom du produit</label>
              <input
                className="input"
                placeholder="ex: Écran 27 pouces 4K"
                value={name}
                onChange={e => setName(e.target.value)}
                required
              />
            </div>
            <div className="col-span-2">
              <label className="label">SKU <span className="text-zinc-600">(référence unique)</span></label>
              <input
                className="input font-mono"
                placeholder="ex: SCRN-27-4K-001"
                value={sku}
                onChange={e => setSku(e.target.value.toUpperCase())}
                required
              />
              <p className="text-xs text-zinc-600 mt-1.5">Code unique du produit (ex : PROD-001). Ne peut pas être modifié après création.</p>
            </div>
            <div>
              <label className="label">Délai de livraison <span className="text-zinc-600">(jours)</span></label>
              <input
                type="number"
                className="input"
                min={0}
                value={leadTime}
                onChange={e => setLeadTime(Number(e.target.value))}
              />
              <p className="text-xs text-zinc-600 mt-1.5">Délai moyen en jours entre la commande fournisseur et la réception en stock</p>
            </div>
            <div>
              <label className="label">Stock de sécurité <span className="text-zinc-600">(unités)</span></label>
              <input
                type="number"
                className="input"
                min={0}
                value={safetyStock}
                onChange={e => setSafetyStock(Number(e.target.value))}
              />
              <p className="text-xs text-zinc-600 mt-1.5">Quantité minimale à toujours garder en stock pour les imprévus</p>
            </div>
            <div className="col-span-2">
              <label className="label">Stock initial <span className="text-zinc-600">(quantité actuellement disponible)</span></label>
              <input
                type="number"
                className="input"
                min={0}
                value={initialStock}
                onChange={e => setInitialStock(Number(e.target.value))}
              />
            </div>
            <div className="col-span-2">
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
              {suppliers.length === 0 && !suppliersLoading && (
                <p className="text-xs text-zinc-600 mt-1.5">
                  Aucun fournisseur disponible.{' '}
                  <Link to="/suppliers" className="text-brand-400 hover:text-brand-300">
                    Créer un fournisseur →
                  </Link>
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button type="submit" className="btn-primary flex items-center gap-2" disabled={loading}>
              {loading ? <Loader2 size={14} className="animate-spin" /> : <Package size={14} />}
              Créer le produit
            </button>
            <Link to="/">
              <button type="button" className="btn-ghost text-sm">Annuler</button>
            </Link>
          </div>
        </form>
      </div>

      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}
