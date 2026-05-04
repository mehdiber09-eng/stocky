import React from 'react'
import { X, QrCode, Download, Printer } from 'lucide-react'

interface Props {
  product: { id: number; name: string; sku: string } | null
  onClose: () => void
}

export default function QRProductModal({ product, onClose }: Props) {
  if (!product) return null

  // Free QR API — encodes the SKU so the scanner can look it up
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encodeURIComponent(product.sku)}&bgcolor=18181b&color=ffffff&margin=12`

  function handleDownload() {
    const a = document.createElement('a')
    a.href = `https://api.qrserver.com/v1/create-qr-code/?size=600x600&data=${encodeURIComponent(product.sku)}&bgcolor=18181b&color=ffffff&margin=20`
    a.download = `qr-${product.sku}.png`
    a.target = '_blank'
    a.click()
  }

  function handlePrint() {
    const win = window.open('', '_blank')
    if (!win) return
    win.document.write(`
      <html><head><title>QR - ${product.name}</title>
      <style>body{display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;background:#fff;font-family:sans-serif;gap:12px}
      h2{font-size:18px;margin:0}p{color:#666;margin:0;font-size:13px}</style></head>
      <body>
        <h2>${product.name}</h2>
        <p>${product.sku}</p>
        <img src="https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(product.sku)}&margin=16" width="300" />
        <script>window.onload=()=>window.print()</script>
      </body></html>
    `)
    win.document.close()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div
        className="relative rounded-3xl border border-white/12 p-6 w-full max-w-sm space-y-5"
        style={{ background: 'rgba(18,18,26,0.98)', boxShadow: '0 40px 100px rgba(0,0,0,0.7)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <QrCode size={18} className="text-brand-400" />
            <span className="font-semibold text-white text-sm">QR Code produit</span>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-zinc-500 hover:text-white hover:bg-white/8 transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Product info */}
        <div className="bg-white/5 rounded-xl px-4 py-3 space-y-0.5">
          <p className="text-sm font-medium text-white">{product.name}</p>
          <p className="text-xs text-zinc-400 font-mono">SKU : {product.sku}</p>
        </div>

        {/* QR image */}
        <div className="flex justify-center">
          <div className="rounded-2xl overflow-hidden border border-white/10 p-3 bg-white">
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(product.sku)}&margin=8`}
              alt={`QR code ${product.sku}`}
              width={200}
              height={200}
              className="block"
            />
          </div>
        </div>

        <p className="text-center text-xs text-zinc-500">
          Ce QR code contient le SKU <span className="text-zinc-300 font-mono">{product.sku}</span>.<br />
          Scannez-le depuis la page <strong className="text-zinc-300">Scan QR</strong>.
        </p>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={handleDownload}
            className="flex items-center justify-center gap-2 py-2.5 rounded-xl border border-white/10 text-sm text-zinc-300 hover:text-white hover:border-white/25 transition-all"
          >
            <Download size={14} /> Télécharger
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm text-white transition-all hover:opacity-90"
            style={{ background: 'linear-gradient(135deg,#6366f1,#d946ef)' }}
          >
            <Printer size={14} /> Imprimer
          </button>
        </div>
      </div>
    </div>
  )
}
