import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { ArrowLeft, Package, Loader2, Truck, Barcode, QrCode } from 'lucide-react'
import { ProductsAPI, SuppliersAPI, Supplier } from '../api/api'
import Toast from '../components/Toast'
import BarcodeScanModal from '../components/BarcodeScanModal'
import QRProductModal from '../components/QRProductModal'
import { useLanguage } from '../context/LanguageContext'

export default function CreateProduct() {
  const { t } = useLanguage()
  const [searchParams] = useSearchParams()
  const [name, setName] = useState('')
  const [sku, setSku] = useState(() => (searchParams.get('sku') ?? '').toUpperCase())
  const [leadTime, setLeadTime] = useState(7)
  const [safetyStock, setSafetyStock] = useState(0)
  const [initialStock, setInitialStock] = useState(0)
  const [supplierId, setSupplierId] = useState<number | null>(null)
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [suppliersLoading, setSuppliersLoading] = useState(false)
  const [loading, setLoading] = useState(false)
  const [scanOpen, setScanOpen] = useState(false)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)
  const [qrProduct, setQrProduct] = useState<{ id: number; name: string; sku: string } | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    setSuppliersLoading(true)
    SuppliersAPI.list()
      .then(res => setSuppliers(res.data))
      .catch(() => {})
      .finally(() => setSuppliersLoading(false))
  }, [])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await ProductsAPI.create({
        name, sku,
        lead_time_days: leadTime,
        safety_stock: safetyStock,
        initial_stock: initialStock,
        supplier_id: supplierId,
      })
      setToast({ msg: t('cp_success'), type: 'success' })
      setQrProduct({ id: res.data.id, name: res.data.name, sku: res.data.sku })
    } catch (err: any) {
      setToast({ msg: err.response?.data?.detail || t('cp_error'), type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="animate-fade-in max-w-xl">
      <Link to="/" className="flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-300 mb-6 transition-colors">
        <ArrowLeft size={14} /> {t('cp_back')}
      </Link>

      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-brand-500/10 flex items-center justify-center text-brand-400">
          <Package size={20} />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-zinc-100">{t('cp_title')}</h1>
          <p className="text-sm text-zinc-500">{t('cp_subtitle')}</p>
        </div>
      </div>

      <div className="card">
        <form onSubmit={submit} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="label">{t('cp_name')}</label>
              <input
                className="input"
                placeholder="ex: Écran 27 pouces 4K"
                value={name}
                onChange={e => setName(e.target.value)}
                required
              />
            </div>
            <div className="col-span-2">
              <label className="label">{t('cp_sku')} <span className="text-zinc-600">({t('cp_sku_note')})</span></label>
              <div className="flex gap-2">
                <input
                  className="input font-mono flex-1"
                  placeholder="ex: SCRN-27-4K-001"
                  value={sku}
                  onChange={e => setSku(e.target.value.toUpperCase())}
                  required
                />
                <button
                  type="button"
                  onClick={() => setScanOpen(true)}
                  className="px-3 py-2 rounded-xl border border-white/10 text-zinc-400 hover:text-brand-300 hover:border-brand-500/40 hover:bg-brand-500/8 transition-all flex items-center gap-1.5 text-xs font-medium shrink-0"
                  title={t('cp_scan_sku')}
                >
                  <Barcode size={14} /> {t('cp_scan_sku')}
                </button>
              </div>
              <p className="text-xs text-zinc-600 mt-1.5">{t('cp_sku_hint')}</p>
            </div>
            <div>
              <label className="label">{t('cp_lead_time')} <span className="text-zinc-600">({t('cp_lead_unit')})</span></label>
              <input
                type="number"
                className="input"
                min={0}
                value={leadTime}
                onChange={e => setLeadTime(Number(e.target.value))}
              />
              <p className="text-xs text-zinc-600 mt-1.5">{t('cp_lead_hint')}</p>
            </div>
            <div>
              <label className="label">{t('cp_safety')} <span className="text-zinc-600">({t('cp_safety_unit')})</span></label>
              <input
                type="number"
                className="input"
                min={0}
                value={safetyStock}
                onChange={e => setSafetyStock(Number(e.target.value))}
              />
              <p className="text-xs text-zinc-600 mt-1.5">{t('cp_safety_hint')}</p>
            </div>
            <div className="col-span-2">
              <label className="label">{t('cp_initial_stock')} <span className="text-zinc-600">({t('cp_initial_hint')})</span></label>
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
                {t('cp_supplier')}
                <span className="text-zinc-600 font-normal">({t('sup_optional')})</span>
              </label>
              {suppliersLoading ? (
                <div className="input flex items-center gap-2 text-zinc-500">
                  <Loader2 size={13} className="animate-spin" />
                  <span className="text-sm">{t('sup_loading')}</span>
                </div>
              ) : (
                <select
                  className="input"
                  value={supplierId ?? ''}
                  onChange={e => setSupplierId(e.target.value ? Number(e.target.value) : null)}
                >
                  <option value="">{t('cp_no_supplier')}</option>
                  {suppliers.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.lead_time_days}j)
                    </option>
                  ))}
                </select>
              )}
              {suppliers.length === 0 && !suppliersLoading && (
                <p className="text-xs text-zinc-600 mt-1.5">
                  {t('cp_supplier_no_data')}{' '}
                  <Link to="/suppliers" className="text-brand-400 hover:text-brand-300">
                    {t('cp_supplier_create')} →
                  </Link>
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button type="submit" className="btn-primary flex items-center gap-2" disabled={loading}>
              {loading ? <Loader2 size={14} className="animate-spin" /> : <Package size={14} />}
              {t('cp_submit')}
            </button>
            <span className="flex items-center gap-1 text-xs text-zinc-600">
              <QrCode size={11} /> QR auto-généré
            </span>
            <Link to="/">
              <button type="button" className="btn-ghost text-sm">{t('btn_cancel')}</button>
            </Link>
          </div>
        </form>
      </div>

      {scanOpen && (
        <BarcodeScanModal
          onDetected={code => setSku(code.toUpperCase())}
          onClose={() => setScanOpen(false)}
        />
      )}

      {qrProduct && (
        <QRProductModal
          product={qrProduct}
          onClose={() => {
            setQrProduct(null)
            navigate('/dashboard')
          }}
        />
      )}

      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}
