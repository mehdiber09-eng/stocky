import React from 'react'

export function SkeletonLine({ w = 'full', h = 4 }: { w?: string; h?: number }) {
  return <div className={`w-${w} h-${h} rounded-lg bg-zinc-800 animate-pulse`} />
}

export function SkeletonCard() {
  return (
    <div className="card space-y-3">
      <SkeletonLine w="1/3" h={3} />
      <SkeletonLine h={8} />
      <SkeletonLine w="2/3" h={3} />
    </div>
  )
}

export function SkeletonTable({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="card overflow-hidden">
      <div className="space-y-3 p-4">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="grid gap-4" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
            {Array.from({ length: cols }).map((_, j) => (
              <SkeletonLine key={j} h={4} />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
