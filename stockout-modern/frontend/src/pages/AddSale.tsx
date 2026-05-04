import React, { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, ShoppingCart, Loader2 } from 'lucide-react'
import { ProductsAPI, SalesAPI, Product } from '../api/api'
import Toast from '../components/Toast'

export default function AddSale() {
  const [products, setProducts] = useState<Product[]>([])
  const [productId, setProductId] = useState<number | ''>('')
  const [quantity, setQuantity] = useState(1)
  const [loading, setLoading] = useState(false)
  const [loadingProducts, setLoadingProducts] = useState(true)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    ProductsAPI.list()
      .then(r => { setProducts(r.data); if (r.data.length > 0) setProductId(r.data[0].id) })
      .finally(() => setLoadingProducts(false))
  }, [])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!productId) return
    setLoading(true)
    try {
      await SalesAPI.add({ product_id: Number(productId), quantity })
      setToast({ msg: 'Vente enregistrée !', type: 'success' })
      setTimeout(() => navigate('/'), 1000)
    } catch (err: any) {
      setToast({ msg: err.response?.data?.detail || 'Erreur lors de l\'enregistrement', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const selectedProduct = products.find(p => p.id === Number(productId))

  return (
    <div className="animate-fade-in max-w-xl">
      <Link to="/" className="flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-300 mb-6 transition-colors">
        <ArrowLeft size={14} /> Retour au dashboard
      </Link>

      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
          <ShoppingCart size={20} />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-zinc-100">Enregistrer une vente</h1>
          <p className="text-sm text-zinc-500">Décrémenter l'inventaire</p>
        </div>
      </div>

      <div className="card">
        {loadingProducts ? (
          <div className="flex items-center justify-center py-8 text-zinc-500">
            <Loader2 size={18} className="animate-spin mr-2" /> Chargement des produits...
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-zinc-400">Aucun produit disponible.</p>
            <Link to="/create-product"><button className="btn-primary mt-3 text-sm">Créer un produit</button></Link>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-5">
            <div>
              <label className="label">Produit</label>
              <select
                className="input"
                value={productId}
                onChange={e => setProductId(Number(e.target.value))}
              >
                {products.map(p => (
                  <option key={p.id} value={p.id}>{p.name} — {p.sku}</option>
                ))}
              </select>
              <p className="text-xs text-zinc-600 mt-1.5">Sélectionnez le produit pour lequel vous enregistrez une vente</p>
            </div>

            {selectedProduct && (
              <div className="bg-surface-tertiary rounded-lg px-4 py-3 text-xs text-zinc-500 flex items-center gap-4">
                <span>Délai: <strong className="text-zinc-300">{selectedProduct.lead_time_days}j</strong></span>
                <span>Stock min: <strong className="text-zinc-300">{selectedProduct.safety_stock}</strong></span>
              </div>
            )}

            <div>
              <label className="label">Quantité vendue</label>
              <input
                type="number"
                className="input"
                min={1}
                value={quantity}
                onChange={e => setQuantity(Math.max(1, Number(e.target.value)))}
              />
              <p className="text-xs text-zinc-600 mt-1.5">Nombre d'unités vendues — le stock sera automatiquement mis à jour</p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button type="submit" className="btn-primary flex items-center gap-2" disabled={loading}>
                {loading ? <Loader2 size={14} className="animate-spin" /> : <ShoppingCart size={14} />}
                Enregistrer la vente
              </button>
              <Link to="/"><button type="button" className="btn-ghost text-sm">Annuler</button></Link>
            </div>
          </form>
        )}
      </div>

      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}
