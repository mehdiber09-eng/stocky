import React, { useState, useRef } from 'react'
import { Upload, FileText, CheckCircle, AlertCircle, Loader2, Download } from 'lucide-react'
import { SalesAPI } from '../api/api'
import Toast from '../components/Toast'
import { useLanguage } from '../context/LanguageContext'

interface CSVRow {
  product_id: string
  quantity: string
  status: string
  error?: string
}

export default function ImportCSV() {
  const { t } = useLanguage()
  const [rows, setRows] = useState<CSVRow[]>([])
  const [importing, setImporting] = useState(false)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  function parseCSV(text: string): CSVRow[] {
    const lines = text.trim().split('\n').filter(l => l.trim())
    const start = lines[0].toLowerCase().includes('product') ? 1 : 0
    return lines.slice(start).map(line => {
      const [product_id, quantity] = line.split(',').map(s => s.trim())
      return { product_id, quantity, status: 'pending' }
    }).filter(r => r.product_id && r.quantity)
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      const text = ev.target?.result as string
      setRows(parseCSV(text))
    }
    reader.readAsText(file)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (!file || !file.name.endsWith('.csv')) return
    const reader = new FileReader()
    reader.onload = ev => setRows(parseCSV(ev.target?.result as string))
    reader.readAsText(file)
  }

  async function importAll() {
    setImporting(true)
    const updated = [...rows]
    for (let i = 0; i < updated.length; i++) {
      const row = updated[i]
      try {
        await SalesAPI.add({ product_id: Number(row.product_id), quantity: Number(row.quantity) })
        updated[i] = { ...row, status: 'success' }
      } catch (err: any) {
        updated[i] = { ...row, status: 'error', error: err.response?.data?.detail || 'Erreur' }
      }
      setRows([...updated])
    }
    setImporting(false)
    const success = updated.filter(r => r.status === 'success').length
    setToast({ msg: `${success}/${updated.length} ${t('imp_imported')}`, type: success > 0 ? 'success' : 'error' })
  }

  function downloadTemplate() {
    const csv = 'product_id,quantity\n1,10\n2,5\n3,20'
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'template_import.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  const success = rows.filter(r => r.status === 'success').length
  const errors = rows.filter(r => r.status === 'error').length

  return (
    <div className="animate-fade-in max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
            <Upload size={20} />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-zinc-100">{t('imp_title')}</h1>
            <p className="text-sm text-zinc-500">{t('imp_subtitle')}</p>
          </div>
        </div>
        <button onClick={downloadTemplate} className="btn-ghost flex items-center gap-2 text-sm">
          <Download size={14} /> {t('imp_download_template')}
        </button>
      </div>

      {/* Drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={e => e.preventDefault()}
        onClick={() => fileRef.current?.click()}
        className="card border-dashed cursor-pointer hover:border-brand-500/50 transition-colors text-center py-12"
      >
        <FileText size={32} className="mx-auto text-zinc-600 mb-3" />
        <p className="text-zinc-400 font-medium mb-1">{t('imp_drop_hint')}</p>
        <p className="text-zinc-600 text-sm">{t('imp_browse_hint')}</p>
        <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleFile} />
      </div>

      {/* Format info */}
      <div className="bg-surface-tertiary rounded-lg px-4 py-3 text-xs text-zinc-500">
        <p className="font-medium text-zinc-400 mb-1">{t('imp_format_label')}</p>
        <code className="font-mono">product_id,quantity</code><br />
        <code className="font-mono">1,10</code><br />
        <code className="font-mono">2,5</code>
      </div>

      {/* Preview table */}
      {rows.length > 0 && (
        <div className="card p-0 overflow-hidden">
          <div className="px-6 py-4 border-b border-surface-border flex items-center justify-between">
            <h2 className="font-medium text-zinc-100">{rows.length} {t('imp_rows_detected')}</h2>
            <div className="flex items-center gap-3">
              {success > 0 && <span className="text-xs text-emerald-400">{success} {t('imp_imported')}</span>}
              {errors > 0 && <span className="text-xs text-red-400">{errors} {t('imp_errors')}</span>}
              <button
                onClick={importAll}
                disabled={importing || rows.every(r => r.status === 'success')}
                className="btn-primary flex items-center gap-2 text-sm"
              >
                {importing ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                {importing ? t('imp_importing') : t('imp_import_all')}
              </button>
            </div>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-border">
                <th className="text-left px-6 py-3 text-xs font-medium text-zinc-500 uppercase">{t('imp_col_id')}</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-zinc-500 uppercase">{t('imp_col_qty')}</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-zinc-500 uppercase">{t('imp_col_status')}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i} className="border-b border-surface-border last:border-0 hover:bg-surface-tertiary/50">
                  <td className="px-6 py-3 font-mono text-zinc-300">{row.product_id}</td>
                  <td className="px-6 py-3 text-zinc-400">{row.quantity}</td>
                  <td className="px-6 py-3">
                    {row.status === 'pending' && <span className="text-zinc-600 text-xs">{t('imp_status_pending')}</span>}
                    {row.status === 'success' && <span className="flex items-center gap-1 text-emerald-400 text-xs"><CheckCircle size={12} /> {t('imp_status_success')}</span>}
                    {row.status === 'error' && <span className="flex items-center gap-1 text-red-400 text-xs"><AlertCircle size={12} /> {row.error}</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}
