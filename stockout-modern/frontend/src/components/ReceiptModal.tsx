import React, { useEffect, useRef } from 'react'
import { X, Printer, Download } from 'lucide-react'
import { Product } from '../api/api'

interface ReceiptItem {
  product: Product
  quantity: number
  unit_price?: number | null
}

interface Props {
  items: ReceiptItem[]
  shopName?: string
  onClose: () => void
}

/**
 * Reçu imprimable au format thermique 80 mm.
 * - Largeur : 80 mm = 302 px à 96 DPI
 * - Imprimable directement (Ctrl+P) ou téléchargeable en PDF via le navigateur
 * - Print CSS dédié : seul le receipt est imprimé, le reste de l'app est masqué
 */
export default function ReceiptModal({ items, shopName = 'Stocky', onClose }: Props) {
  const receiptRef = useRef<HTMLDivElement>(null)

  const total = items.reduce((sum, it) => sum + (it.unit_price || 0) * it.quantity, 0)
  const currency = items[0]?.product.price_currency || 'DZD'
  const date = new Date()
  const ticketNum = `T${Date.now().toString().slice(-8)}`

  // Imprime juste le ticket
  function handlePrint() {
    window.print()
  }

  // Verrouille le scroll du body quand le modal est ouvert
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 receipt-overlay">
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
        <div className="relative w-full max-w-md max-h-[90vh] flex flex-col bg-zinc-950 rounded-2xl border border-white/10 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-white/8 shrink-0">
            <h2 className="text-sm font-semibold text-white">🧾 Ticket de caisse</h2>
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrint}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-brand-500/20 hover:bg-brand-500/30 text-brand-300 transition-colors"
              >
                <Printer size={13} /> Imprimer
              </button>
              <button onClick={onClose} className="p-1.5 rounded-lg text-zinc-500 hover:text-white hover:bg-white/8">
                <X size={15} />
              </button>
            </div>
          </div>

          {/* Receipt preview */}
          <div className="flex-1 overflow-y-auto p-5 bg-zinc-900/50">
            <div
              ref={receiptRef}
              id="stocky-receipt"
              className="mx-auto bg-white text-black p-4 font-mono text-[12px] leading-tight"
              style={{ width: '302px', minHeight: '400px' }}
            >
              {/* Header */}
              <div className="text-center mb-3">
                <div className="font-bold text-base">{shopName}</div>
                <div className="text-[10px] text-zinc-700">stocky.app</div>
              </div>

              <div className="border-t border-dashed border-black my-2" />

              {/* Meta */}
              <div className="text-[10px] text-zinc-700 space-y-0.5 mb-2">
                <div>Date : {date.toLocaleString('fr-DZ', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
                <div>N° : {ticketNum}</div>
              </div>

              <div className="border-t border-dashed border-black my-2" />

              {/* Items */}
              <table className="w-full text-[11px]">
                <thead>
                  <tr className="border-b border-black">
                    <th className="text-left py-1">Produit</th>
                    <th className="text-right">Qté</th>
                    <th className="text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map(({ product, quantity, unit_price }) => {
                    const lineTotal = (unit_price || 0) * quantity
                    return (
                      <tr key={product.id} className="border-b border-dotted border-zinc-400">
                        <td className="py-1 align-top">
                          <div className="font-medium">{product.name}</div>
                          {unit_price ? (
                            <div className="text-[9px] text-zinc-700">{unit_price} {currency}/u</div>
                          ) : null}
                        </td>
                        <td className="text-right align-top py-1">×{quantity}</td>
                        <td className="text-right align-top py-1">
                          {unit_price ? `${lineTotal.toFixed(2)} ${currency}` : '—'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>

              <div className="border-t-2 border-black mt-3 pt-2">
                <div className="flex justify-between font-bold text-[13px]">
                  <span>TOTAL</span>
                  <span>{total.toFixed(2)} {currency}</span>
                </div>
              </div>

              <div className="border-t border-dashed border-black my-3" />

              {/* Footer */}
              <div className="text-center text-[10px] text-zinc-700 space-y-1">
                <div>Merci pour votre achat 🙏</div>
                <div>{shopName} · {new Date().getFullYear()}</div>
              </div>
            </div>
          </div>

          {/* Bottom hint */}
          <div className="px-5 py-3 border-t border-white/8 text-xs text-zinc-500 shrink-0">
            💡 Imprimante thermique 80 mm recommandée. Tu peux aussi sauvegarder en PDF (dialogue d'impression → Destination → Enregistrer en PDF).
          </div>
        </div>
      </div>

      {/* Print CSS — masque tout sauf le ticket à l'impression */}
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          .receipt-overlay, .receipt-overlay * { visibility: hidden !important; }
          #stocky-receipt, #stocky-receipt * {
            visibility: visible !important;
          }
          #stocky-receipt {
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            margin: 0 !important;
            background: white !important;
            color: black !important;
          }
          @page {
            size: 80mm auto;
            margin: 0;
          }
        }
      `}</style>
    </>
  )
}
