import React from 'react'
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis,
  Tooltip, CartesianGrid, ReferenceLine,
} from 'recharts'

interface DataPoint {
  label: string
  probability: number
  lower: number
  upper: number
}

interface Props {
  data: DataPoint[]
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  const d = payload[0]?.payload as DataPoint
  return (
    <div className="bg-surface-secondary border border-surface-border rounded-xl p-3 text-xs space-y-1 shadow-xl">
      <p className="text-zinc-400 font-medium">{label}</p>
      <p className="text-brand-400 font-semibold">Probabilité: {(d.probability * 100).toFixed(1)}%</p>
      <p className="text-zinc-500">IC: [{(d.lower * 100).toFixed(1)}%, {(d.upper * 100).toFixed(1)}%]</p>
    </div>
  )
}

export default function PredictionChart({ data }: Props) {
  if (!data || data.length === 0) return null

  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="gradProb" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="gradRange" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#818cf8" stopOpacity={0.1} />
            <stop offset="95%" stopColor="#818cf8" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fill: '#71717a', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tickFormatter={(v) => `${(v * 100).toFixed(0)}%`}
          tick={{ fill: '#71717a', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          domain={[0, 1]}
        />
        <Tooltip content={<CustomTooltip />} />
        <ReferenceLine y={0.5} stroke="#ef4444" strokeDasharray="4 4" strokeOpacity={0.5} />
        <Area
          type="monotone"
          dataKey="upper"
          stroke="transparent"
          fill="url(#gradRange)"
          stackId="1"
        />
        <Area
          type="monotone"
          dataKey="probability"
          stroke="#6366f1"
          strokeWidth={2}
          fill="url(#gradProb)"
          dot={false}
          activeDot={{ r: 4, fill: '#6366f1', stroke: '#0f0f11', strokeWidth: 2 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
