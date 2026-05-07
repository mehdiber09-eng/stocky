import React, { useEffect, useState } from 'react'
import { ProductsAPI, Product } from '../api/api'
import { QrCode, Printer, Loader2, Package, ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function QRBatchPrint() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [selectAll, setSelectAll] = useState(true)

  useEffect(() => {
    ProductsAPI.list()
      .then(r => {
        setProducts(r.data)
        setSelected(new Set(r.data.map(p => p.id)))
      })
      .finally(() => setLoading(false))
  }, [])

  function toggleSelect(id: number) {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function toggleAll() {
    if (selectAll) {
      setSelected(new Set())
    } else {
      setSelected(new Set(products.map(p => p.id)))
    }
    setSelectAll(s => !s)
  }

  const printList = products.filter(p => selected.has(p.id))

  return (
    <div className="animate-fade-in space-y-6">
      <Link to="/dashboard" className="flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-300 transition-colors no-print">
        <ArrowLeft size={14} /> Retour
      </Link>

      <div className="flex items-center justify-between no-print">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-500/10 flex items-center justify-center text-brand-400">
            <QrCode size={20} />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-zinc-100">Impression QR en lot</h1>
            <p className="text-sm text-zinc-500">
              {printList.length} / {products.length} produit{products.length > 1 ? 's' : ''} sélectionné{printList.length > 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleAll}
            className="px-3 py-2 rounded-xl text-xs font-medium border border-white/10 text-zinc-400 hover:text-white hover:border-white/20 transition-all"
          >
            {selectAll ? 'Tout désélectionner' : 'Tout sélectionner'}
          </button>
          <button
            onClick={() => window.print()}
            disabled={printList.length === 0}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-40 transition-all hover:opacity-90 active:scale-95"
            style={{ background: 'linear-gradient(135deg,#6366f1,#d946ef)', boxShadow: '0 4px 16px rgba(99,102,241,0.3)' }}
          >
            <Printer size={14} />
            Imprimer {printList.length > 0 ? `(${printList.length})` : ''}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={24} className="animate-spin text-zinc-500" />
        </div>
      ) : products.length === 0 ? (
        <div className="card text-center py-16">
          <Package size={40} className="mx-auto text-zinc-700 mb-3" />
          <p className="text-zinc-400 font-medium">Aucun produit dans votre catalogue</p>
          <Link to="/create-product">
            <button className="btn-primary mt-4 text-sm">Créer un produit</button>
          </Link>
        </div>
      ) : (
        <>
          {/* Selection grid (screen only) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 no-print">
            {products.map(p => {
              const isSelected = selected.has(p.id)
              return (
                <button
                  key={p.id}
                  onClick={() => toggleSelect(p.id)}
                  className={`card text-center space-y-2 transition-all border-2 ${
                    isSelected
                      ? 'border-brand-500/50 bg-brand-500/5'
                      : 'border-transparent opacity-50 hover:opacity-75'
                  }`}
                >
                  <div className="flex justify-center">
                    <div className="rounded-xl overflow-hidden bg-white p-2 w-fit">
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(p.sku)}&margin=4`}
                        alt={p.sku}
                        width={90}
                        height={90}
                        className="block"
                        loading="lazy"
                      />
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-zinc-200 truncate">{p.name}</p>
                    <p className="text-[10px] text-zinc-500 font-mono">{p.sku}</p>
                  </div>
                  <div className={`text-[10px] font-bold px-2 py-0.5 rounded-full mx-auto w-fit ${
                    isSelected ? 'bg-brand-500/20 text-brand-400' : 'bg-zinc-700/50 text-zinc-500'
                  }`}>
                    {isSelected ? '✓ Sélectionné' : '+ Ajouter'}
                  </div>
                </button>
              )
            })}
          </div>

          {/* Print layout */}
          <div className="print-only hidden">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', padding: '16px' }}>
              {printList.map(p => (
                <div key={p.id} style={{ textAlign: 'center', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '12px', pageBreakInside: 'avoid' }}>
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(p.sku)}&margin=6`}
                    alt={p.sku}
                    width={160}
                    height={160}
                    style={{ display: 'block', margin: '0 auto 8px' }}
                  />
                  <p style={{ fontWeight: 700, fontSize: '12px', margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</p>
                  <p style={{ fontFamily: 'monospace', fontSize: '10px', color: '#6b7280', margin: 0 }}>{p.sku}</p>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          .print-only, .print-only * { visibility: visible !important; display: block !important; }
          .print-only { position: fixed; top: 0; left: 0; width: 100%; }
          @page { margin: 8mm; }
        }
      `}</style>
    </div>
  )
}
