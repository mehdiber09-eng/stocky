import React, { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Truck, Package, PackageCheck, Loader2, RefreshCw, Plus, Minus, CheckCircle, ArrowLeft } from 'lucide-react'
import { ProductsAPI, InventoryAPI, Product, Inventory } from '../api/api'
import { useLanguage } from '../context/LanguageContext'
import Toast from '../components/Toast'

interface ProductRow {
  product: Product
  currentStock: number
  received: number
}

export default function StockReception() {
  const { t, isRTL } = useLanguage()
  const [rows, setRows] = useState<ProductRow[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [pRes, iRes] = await Promise.all([ProductsAPI.list(), InventoryAPI.list()])
      const products: Product[] = pRes.data
      const inventory: Inventory[] = iRes.data
      const invMap = new Map(inventory.map(i => [i.product_id, i.quantity]))
      setRows(
        products.map(p => ({
          product: p,
          currentStock: invMap.get(p.id) ?? 0,
          received: 0,
        }))
      )
    } catch {
      setToast({ msg: t('toast_error'), type: 'error' })
    } finally {
      setLoading(false)
    }
  }, [t])

  useEffect(() => { load() }, [load])

  function setReceived(productId: number, value: number) {
    setRows(prev =>
      prev.map(r =>
        r.product.id === productId ? { ...r, received: Math.max(0, value) } : r
      )
    )
  }

  function increment(productId: number) {
    setRows(prev =>
      prev.map(r =>
        r.product.id === productId ? { ...r, received: r.received + 1 } : r
      )
    )
  }

  function decrement(productId: number) {
    setRows(prev =>
      prev.map(r =>
        r.product.id === productId ? { ...r, received: Math.max(0, r.received - 1) } : r
      )
    )
  }

  const toUpdate = rows.filter(r => r.received > 0)

  async function handleSubmit() {
    if (toUpdate.length === 0) return
    setSubmitting(true)
    try {
      await Promise.all(
        toUpdate.map(r =>
          InventoryAPI.update(r.product.id, r.currentStock + r.received)
        )
      )
      setToast({
        msg: `${toUpdate.length} produit${toUpdate.length > 1 ? 's' : ''} mis à jour avec succès`,
        type: 'success',
      })
      setRows(prev =>
        prev.map(r => ({
          ...r,
          currentStock: r.received > 0 ? r.currentStock + r.received : r.currentStock,
          received: 0,
        }))
      )
    } catch {
      setToast({ msg: t('toast_error'), type: 'error' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="animate-fade-in max-w-3xl" dir={isRTL ? 'rtl' : 'ltr'}>
      <Link
        to="/"
        className="flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-300 mb-6 transition-colors w-fit"
      >
        <ArrowLeft size={14} />
        {t('btn_back')}
      </Link>

      <div className="flex items-center justify-between mb-8 gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-500/10 flex items-center justify-center text-brand-400">
            <Truck size={20} />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-zinc-100">Réception de marchandise</h1>
            <p className="text-sm text-zinc-500">Mettez à jour le stock de plusieurs produits en une opération</p>
          </div>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="btn-glass flex items-center gap-2 text-sm"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          {t('btn_refresh')}
        </button>
      </div>

      <div className="flex items-center gap-3 mb-5 px-4 py-3 rounded-xl bg-white/5 border border-white/8">
        <Package size={16} className="text-zinc-400 shrink-0" />
        {toUpdate.length === 0 ? (
          <span className="text-sm text-zinc-500">Aucun produit à mettre à jour</span>
        ) : (
          <span className="text-sm text-zinc-300">
            <span className="font-semibold text-brand-400">{toUpdate.length}</span>
            {' '}produit{toUpdate.length > 1 ? 's' : ''} à mettre à jour
          </span>
        )}
      </div>

      <div className="card p-0 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-zinc-500 gap-2">
            <Loader2 size={18} className="animate-spin" />
            <span className="text-sm">{t('btn_loading')}</span>
          </div>
        ) : rows.length === 0 ? (
          <div className="text-center py-16">
            <Package size={36} className="mx-auto text-zinc-600 mb-3" />
            <p className="text-zinc-400 text-sm">{t('inv_no_products')}</p>
            <p className="text-zinc-600 text-xs mt-1">{t('inv_no_products_sub')}</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {rows.map(row => {
              const hasQty = row.received > 0
              return (
                <div
                  key={row.product.id}
                  className={`flex items-center gap-4 px-5 py-4 transition-colors ${hasQty ? 'bg-brand-500/5' : 'hover:bg-white/3'}`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-zinc-200 truncate">
                        {row.product.name}
                      </span>
                      {hasQty && (
                        <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 font-medium border border-emerald-500/20">
                          <CheckCircle size={10} />
                          +{row.received}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-xs text-zinc-600 font-mono">{row.product.sku}</span>
                      <span className="text-xs text-zinc-500">
                        Stock actuel :{' '}
                        <span className="text-zinc-300 font-medium">{row.currentStock}</span>
                      </span>
                      {hasQty && (
                        <span className="text-xs text-emerald-500">
                          → {row.currentStock + row.received}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => decrement(row.product.id)}
                      disabled={row.received === 0}
                      className="w-8 h-8 rounded-lg bg-white/5 border border-white/8 flex items-center justify-center text-zinc-400 hover:bg-white/10 hover:text-zinc-200 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <Minus size={12} />
                    </button>
                    <input
                      type="number"
                      min={0}
                      value={row.received}
                      onChange={e => setReceived(row.product.id, Math.floor(Number(e.target.value)))}
                      className="w-20 text-center bg-white/5 border border-white/8 rounded-lg px-2 py-1.5 text-sm text-zinc-200 focus:outline-none focus:ring-1 focus:ring-brand-500/50 focus:border-brand-500/50 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => increment(row.product.id)}
                      className="w-8 h-8 rounded-lg bg-white/5 border border-white/8 flex items-center justify-center text-zinc-400 hover:bg-white/10 hover:text-zinc-200 transition-all"
                    >
                      <Plus size={12} />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {rows.length > 0 && (
        <div className="mt-5 flex items-center gap-3">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={toUpdate.length === 0 || submitting}
            className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <PackageCheck size={14} />
            )}
            {submitting ? 'Validation...' : 'Valider la réception'}
          </button>
          {toUpdate.length > 0 && !submitting && (
            <span className="text-xs text-zinc-600">
              {toUpdate.length} produit{toUpdate.length > 1 ? 's' : ''} · +{toUpdate.reduce((s, r) => s + r.received, 0)} unités au total
            </span>
          )}
        </div>
      )}

      {toast && (
        <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />
      )}
    </div>
  )
}
