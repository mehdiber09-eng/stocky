import React, { useState } from 'react'

interface Props {
  text: string
  children: React.ReactElement
  position?: 'top' | 'bottom' | 'left' | 'right'
}

export default function Tooltip({ text, children, position = 'top' }: Props) {
  const [visible, setVisible] = useState(false)
  const posClass = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  }[position]

  return (
    <div className="relative inline-flex" onMouseEnter={() => setVisible(true)} onMouseLeave={() => setVisible(false)}>
      {children}
      {visible && (
        <div className={`absolute z-50 ${posClass} px-2.5 py-1.5 text-xs text-white bg-zinc-800 border border-zinc-700 rounded-lg shadow-xl whitespace-nowrap pointer-events-none`}>
          {text}
          <div className="absolute inset-0 rounded-lg" />
        </div>
      )}
    </div>
  )
}
