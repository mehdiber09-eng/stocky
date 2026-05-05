import React, { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, ShoppingCart, Loader2 } from 'lucide-react'
import { ProductsAPI, SalesAPI, Product } from '../api/api'
import Toast from '../components/Toast'
import { useLanguage } from '../context/LanguageContext'

export default function AddSale() {
  const { t } = useLanguage()
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
      setToast({ msg: t('sale_success'), type: 'success' })
      setTimeout(() => navigate('/'), 1000)
    } catch (err: any) {
      setToast({ msg: err.response?.data?.detail || t('sale_error'), type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const selectedProduct = products.find(p => p.id === Number(productId))

  return (
    <div className="animate-fade-in max-w-xl">
      <Link to="/" className="flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-300 mb-6 transition-colors">
        <ArrowLeft size={14} /> {t('sale_back')}
      </Link>

      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
          <ShoppingCart size={20} />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-zinc-100">{t('sale_title')}</h1>
          <p className="text-sm text-zinc-500">{t('sale_subtitle')}</p>
        </div>
      </div>

      <div className="card">
        {loadingProducts ? (
          <div className="flex items-center justify-center py-8 text-zinc-500">
            <Loader2 size={18} className="animate-spin mr-2" /> {t('sale_loading')}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-zinc-400">{t('sale_no_products')}</p>
            <Link to="/create-product"><button className="btn-primary mt-3 text-sm">{t('sale_create_product')}</button></Link>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-5">
            <div>
              <label className="label">{t('sale_product')}</label>
              <select
                className="input"
                value={productId}
                onChange={e => setProductId(Number(e.target.value))}
              >
                {products.map(p => (
                  <option key={p.id} value={p.id}>{p.name} — {p.sku}</option>
                ))}
              </select>
              <p className="text-xs text-zinc-600 mt-1.5">{t('sale_product_hint')}</p>
            </div>

            {selectedProduct && (
              <div className="bg-surface-tertiary rounded-lg px-4 py-3 text-xs text-zinc-500 flex items-center gap-4">
                <span>{t('sale_delay')} <strong className="text-zinc-300">{selectedProduct.lead_time_days}j</strong></span>
                <span>{t('sale_min_stock')} <strong className="text-zinc-300">{selectedProduct.safety_stock}</strong></span>
              </div>
            )}

            <div>
              <label className="label">{t('sale_qty')}</label>
              <input
                type="number"
                className="input"
                min={1}
                value={quantity}
                onChange={e => setQuantity(Math.max(1, Number(e.target.value)))}
              />
              <p className="text-xs text-zinc-600 mt-1.5">{t('sale_qty_hint')}</p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button type="submit" className="btn-primary flex items-center gap-2" disabled={loading}>
                {loading ? <Loader2 size={14} className="animate-spin" /> : <ShoppingCart size={14} />}
                {t('sale_submit')}
              </button>
              <Link to="/"><button type="button" className="btn-ghost text-sm">{t('btn_cancel')}</button></Link>
            </div>
          </form>
        )}
      </div>

      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}
