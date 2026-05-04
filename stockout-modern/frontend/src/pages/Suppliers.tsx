import React, { useEffect, useState, useCallback } from 'react'
import {
  Truck, Plus, Trash2, Edit2, Mail, Phone, Clock,
  Loader2, RefreshCw, X, Check, AlertTriangle,
} from 'lucide-react'
import { SuppliersAPI, Supplier } from '../api/api'
import Toast from '../components/Toast'
import ConfirmModal from '../components/ConfirmModal'
import { useLanguage } from '../context/LanguageContext'

interface SupplierFormData {
  name: string
  contact_email: string
  phone: string
  lead_time_days: number
}

const EMPTY_FORM: SupplierFormData = {
  name: '',
  contact_email: '',
  phone: '',
  lead_time_days: 7,
}

function SupplierModal({
  supplier,
  onClose,
  onSaved,
}: {
  supplier: Supplier | null
  onClose: () => void
  onSaved: () => void
}) {
  const { t } = useLanguage()
  const isEdit = supplier !== null
  const [form, setForm] = useState<SupplierFormData>(
    supplier
      ? {
          name: supplier.name,
          contact_email: supplier.contact_email ?? '',
          phone: supplier.phone ?? '',
          lead_time_days: supplier.lead_time_days,
        }
      : EMPTY_FORM
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function set<K extends keyof SupplierFormData>(key: K, value: SupplierFormData[K]) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const payload = {
        name: form.name.trim(),
        contact_email: form.contact_email.trim() || null,
        phone: form.phone.trim() || null,
        lead_time_days: form.lead_time_days,
      }
      if (isEdit) {
        await SuppliersAPI.update(supplier!.id, payload)
      } else {
        await SuppliersAPI.create(payload as Omit<Supplier, 'id' | 'created_at'>)
      }
      onSaved()
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md card animate-fade-in">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-brand-500/10 flex items-center justify-center text-brand-400">
              <Truck size={18} />
            </div>
            <div>
              <h2 className="font-semibold text-zinc-100">
                {isEdit ? t('sup_edit') : t('sup_new')}
              </h2>
              <p className="text-xs text-zinc-500">
                {isEdit ? `${t('inv_edit')} : ${supplier!.name}` : t('sup_no_suppliers_sub')}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="btn-ghost p-1.5 rounded-lg">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="label">{t('sup_name')}</label>
            <input
              className="input"
              placeholder="ex: Fournisseur Express SARL"
              value={form.name}
              onChange={e => set('name', e.target.value)}
              required
            />
          </div>

          <div>
            <label className="label flex items-center gap-1.5">
              <Mail size={12} className="text-zinc-500" />
              {t('sup_contact_email')}
              <span className="text-zinc-600 font-normal">{t('sup_optional')}</span>
            </label>
            <input
              className="input"
              type="email"
              placeholder="contact@fournisseur.com"
              value={form.contact_email}
              onChange={e => set('contact_email', e.target.value)}
            />
          </div>

          <div>
            <label className="label flex items-center gap-1.5">
              <Phone size={12} className="text-zinc-500" />
              {t('sup_phone_label')}
              <span className="text-zinc-600 font-normal">{t('sup_optional')}</span>
            </label>
            <input
              className="input"
              type="tel"
              placeholder="+213 555 123 456"
              value={form.phone}
              onChange={e => set('phone', e.target.value)}
            />
          </div>

          <div>
            <label className="label flex items-center gap-1.5">
              <Clock size={12} className="text-zinc-500" />
              {t('sup_lead_label')}
              <span className="text-zinc-600 font-normal">({t('pred_days')})</span>
            </label>
            <input
              className="input"
              type="number"
              min={0}
              max={365}
              value={form.lead_time_days}
              onChange={e => set('lead_time_days', Number(e.target.value))}
              required
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2.5">
              <AlertTriangle size={14} />
              {error}
            </div>
          )}

          <div className="flex items-center gap-3 pt-1">
            <button type="submit" className="btn-primary flex items-center gap-2" disabled={loading}>
              {loading ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
              {isEdit ? t('sup_save_btn') : t('sup_create_btn')}
            </button>
            <button type="button" className="btn-ghost text-sm" onClick={onClose}>
              {t('btn_cancel')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function SupplierCard({
  supplier,
  onEdit,
  onDelete,
}: {
  supplier: Supplier
  onEdit: (s: Supplier) => void
  onDelete: (s: Supplier) => void
}) {
  return (
    <div className="card hover:border-white/15 transition-all group">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-brand-500/10 flex items-center justify-center text-brand-400 shrink-0">
            <Truck size={18} />
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-zinc-100 truncate">{supplier.name}</h3>
            <p className="text-xs text-zinc-500 mt-0.5">
              ID #{supplier.id} · Ajouté le {new Date(supplier.created_at).toLocaleDateString('fr-FR')}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <button
            onClick={() => onEdit(supplier)}
            className="p-1.5 rounded-lg text-zinc-500 hover:text-brand-300 hover:bg-brand-500/10 transition-all"
            title="Modifier"
          >
            <Edit2 size={14} />
          </button>
          <button
            onClick={() => onDelete(supplier)}
            className="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
            title="Supprimer"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3">
        <div className="glass-subtle rounded-xl p-3">
          <div className="flex items-center gap-1.5 text-zinc-500 mb-1">
            <Clock size={11} />
            <span className="text-[10px] uppercase tracking-wider font-medium">Délai</span>
          </div>
          <p className="text-sm font-semibold text-zinc-200">
            {supplier.lead_time_days}
            <span className="text-zinc-500 font-normal ml-1">j</span>
          </p>
        </div>

        <div className="glass-subtle rounded-xl p-3">
          <div className="flex items-center gap-1.5 text-zinc-500 mb-1">
            <Mail size={11} />
            <span className="text-[10px] uppercase tracking-wider font-medium">Email</span>
          </div>
          {supplier.contact_email ? (
            <a
              href={`mailto:${supplier.contact_email}`}
              className="text-xs text-brand-400 hover:text-brand-300 truncate block"
              title={supplier.contact_email}
            >
              {supplier.contact_email}
            </a>
          ) : (
            <p className="text-xs text-zinc-600">—</p>
          )}
        </div>

        <div className="glass-subtle rounded-xl p-3">
          <div className="flex items-center gap-1.5 text-zinc-500 mb-1">
            <Phone size={11} />
            <span className="text-[10px] uppercase tracking-wider font-medium">Tél.</span>
          </div>
          {supplier.phone ? (
            <a
              href={`tel:${supplier.phone}`}
              className="text-xs text-brand-400 hover:text-brand-300 truncate block"
              title={supplier.phone}
            >
              {supplier.phone}
            </a>
          ) : (
            <p className="text-xs text-zinc-600">—</p>
          )}
        </div>
      </div>
    </div>
  )
}

export default function Suppliers() {
  const { t } = useLanguage()
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState<'create' | Supplier | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Supplier | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await SuppliersAPI.list()
      setSuppliers(res.data)
    } catch {
      setToast({ msg: 'Impossible de charger les fournisseurs', type: 'error' })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleteLoading(true)
    try {
      await SuppliersAPI.delete(deleteTarget.id)
      setToast({ msg: `Fournisseur "${deleteTarget.name}" supprimé`, type: 'success' })
      setDeleteTarget(null)
      load()
    } catch (err: any) {
      setToast({ msg: err.response?.data?.detail || 'Erreur lors de la suppression', type: 'error' })
    } finally {
      setDeleteLoading(false)
    }
  }

  function handleSaved() {
    setModal(null)
    setToast({ msg: modal === 'create' ? 'Fournisseur créé !' : 'Fournisseur mis à jour !', type: 'success' })
    load()
  }

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div className="card-glow relative overflow-hidden">
        <div className="absolute -top-20 -right-12 w-60 h-60 rounded-full bg-brand-500/10 blur-3xl pointer-events-none" />
        <div className="relative flex items-center justify-between gap-4 flex-wrap">
          <div>
            <div className="inline-flex items-center gap-2 badge-info mb-2">
              <Truck size={10} /> {t('sup_title')}
            </div>
            <h1 className="text-2xl font-semibold text-gradient">{t('sup_title')}</h1>
            <p className="text-sm text-zinc-400 mt-1">
              {suppliers.length} fournisseur{suppliers.length !== 1 ? 's' : ''} enregistré{suppliers.length !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={load} className="btn-glass flex items-center gap-2 text-sm" disabled={loading}>
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              {t('btn_refresh')}
            </button>
            <button onClick={() => setModal('create')} className="btn-primary flex items-center gap-2 text-sm">
              <Plus size={14} />
              {t('sup_add')}
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20 text-zinc-500">
          <Loader2 size={20} className="animate-spin mr-2" /> Chargement...
        </div>
      ) : suppliers.length === 0 ? (
        <div className="card text-center py-14">
          <div className="w-14 h-14 rounded-2xl bg-brand-500/10 flex items-center justify-center text-brand-400 mx-auto mb-4">
            <Truck size={26} />
          </div>
          <p className="text-zinc-300 font-medium">{t('sup_no_suppliers')}</p>
          <p className="text-zinc-600 text-sm mt-1 mb-5">{t('sup_no_suppliers_sub')}</p>
          <button onClick={() => setModal('create')} className="btn-primary inline-flex items-center gap-2 text-sm mx-auto">
            <Plus size={14} />
            {t('sup_add')}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {suppliers.map(s => (
            <SupplierCard
              key={s.id}
              supplier={s}
              onEdit={sup => setModal(sup)}
              onDelete={sup => setDeleteTarget(sup)}
            />
          ))}
        </div>
      )}

      {/* Create / Edit modal */}
      {modal !== null && (
        <SupplierModal
          supplier={modal === 'create' ? null : modal}
          onClose={() => setModal(null)}
          onSaved={handleSaved}
        />
      )}

      {/* Delete confirmation modal */}
      <ConfirmModal
        open={deleteTarget !== null}
        title="Supprimer ce fournisseur ?"
        message={`Êtes-vous sûr de vouloir supprimer "${deleteTarget?.name ?? ''}" ? Les produits associés perdront ce fournisseur.`}
        confirmLabel="Supprimer"
        danger
        loading={deleteLoading}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}
