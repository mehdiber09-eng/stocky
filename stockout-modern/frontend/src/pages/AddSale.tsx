import React, { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, ShoppingCart, Loader2, Package, Printer } from 'lucide-react'
import { ProductsAPI, SalesAPI, Product } from '../api/api'
import Toast from '../components/Toast'
import ReceiptModal from '../components/ReceiptModal'
import { useLanguage } from '../context/LanguageContext'

export default function AddSale() {
  const { t } = useLanguage()
  const [products, setProducts] = useState<Product[]>([])
  const [productId, setProductId] = useState<number | ''>('')
  const [quantity, setQuantity] = useState(1)
  const [loading, setLoading] = useState(false)
  const [loadingProducts, setLoadingProducts] = useState(true)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)
  const [receipt, setReceipt] = useState<{ product: Product; quantity: number } | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    ProductsAPI.list()
      .then(r => { setProducts(r.data); if (r.data.length > 0) setProductId(r.data[0].id) })
      .finally(() => setLoadingProducts(false))
  }, [])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!productId) return
    const product = products.find(p => p.id === Number(productId))
    if (!product) return
    setLoading(true)
    try {
      await SalesAPI.add({ product_id: Number(productId), quantity })
      setToast({ msg: t('sale_success'), type: 'success' })
      setReceipt({ product, quantity })  // ouvre le modal de ticket
    } catch (err: any) {
      setToast({ msg: err.response?.data?.detail || t('sale_error'), type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  function closeReceipt() {
    setReceipt(null)
    navigate('/')
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
              <div className="rounded-xl bg-white/3 border border-white/8 p-3 flex items-center gap-4">
                {selectedProduct.image_url ? (
                  <img
                    src={selectedProduct.image_url}
                    alt={selectedProduct.name}
                    className="w-16 h-16 rounded-lg object-cover border border-white/10 shrink-0"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                    <Package size={22} className="text-zinc-600" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-zinc-100 truncate">{selectedProduct.name}</p>
                  <code className="text-[10px] text-zinc-500 font-mono">{selectedProduct.sku}</code>
                  <div className="flex gap-3 mt-1.5 text-xs text-zinc-500">
                    <span>{t('sale_delay')} <strong className="text-zinc-300">{selectedProduct.lead_time_days}j</strong></span>
                    <span>{t('sale_min_stock')} <strong className="text-zinc-300">{selectedProduct.safety_stock}</strong></span>
                  </div>
                </div>
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
      {receipt && (
        <ReceiptModal
          items={[{
            product: receipt.product,
            quantity: receipt.quantity,
            unit_price: receipt.product.unit_price,
          }]}
          onClose={closeReceipt}
        />
      )}
    </div>
  )
}
