import { useUIStore } from '../../stores/uiStore'
import {
  LineChart, Line, XAxis, YAxis, ResponsiveContainer,
  Tooltip, CartesianGrid
} from 'recharts'
import { ChevronDown, ChevronUp, Download, Activity, Zap, TrendingUp } from 'lucide-react'

export default function BottomPanel({ data = [], collisions = [], onExport }) {
  const { bottomPanelOpen, toggleBottomPanel, bottomTab, setBottomTab } = useUIStore()

  const tabs = [
    { id: 'analytics', label: 'Analytics', icon: Activity },
    { id: 'collisions', label: 'Collisions', icon: Zap },
  ]

  return (
    <div
      className="flex flex-col border-t transition-all duration-300"
      style={{
        height: bottomPanelOpen ? 'var(--bottom-panel-height)' : '32px',
        background: 'var(--color-bg-surface)',
        borderColor: 'var(--color-border-subtle)',
        overflow: 'hidden',
      }}
    >
      {/* Tab Bar */}
      <div
        className="flex items-center justify-between px-3 shrink-0"
        style={{ height: '32px', borderBottom: bottomPanelOpen ? '1px solid var(--color-border-subtle)' : 'none' }}
      >
        <div className="flex items-center gap-0.5">
          {tabs.map(tab => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => {
                  if (!bottomPanelOpen) toggleBottomPanel()
                  setBottomTab(tab.id)
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors duration-150"
                style={{
                  background: bottomTab === tab.id && bottomPanelOpen ? 'var(--color-bg-hover)' : 'transparent',
                  color: bottomTab === tab.id && bottomPanelOpen ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                <Icon size={12} />
                {tab.label}
              </button>
            )
          })}
        </div>

        <div className="flex items-center gap-1">
          <button
            title="Export CSV"
            onClick={onExport}
            className="p-1.5 rounded-md transition-colors"
            style={{ background: 'transparent', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer' }}
            onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-text-secondary)'}
            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--color-text-muted)'}
          >
            <Download size={13} />
          </button>
          <button
            onClick={toggleBottomPanel}
            className="p-1.5 rounded-md transition-colors"
            style={{ background: 'transparent', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer' }}
          >
            {bottomPanelOpen ? <ChevronDown size={13} /> : <ChevronUp size={13} />}
          </button>
        </div>
      </div>

      {/* Content */}
      {bottomPanelOpen && (
        <div className="flex-1 overflow-hidden">
          {bottomTab === 'analytics' ? (
            <AnalyticsView data={data} />
          ) : (
            <CollisionsView collisions={collisions} />
          )}
        </div>
      )}
    </div>
  )
}

function AnalyticsView({ data }) {
  const charts = [
    { key: 'velocity', label: 'Velocity', unit: 'px/t', color: '#60a5fa', icon: TrendingUp },
    { key: 'energy', label: 'Kinetic Energy', unit: 'J', color: '#c084fc', icon: Activity },
    { key: 'force', label: 'Net Force', unit: 'N', color: '#e8a84c', icon: Zap },
  ]

  return (
    <div className="grid grid-cols-3 gap-0 h-full">
      {charts.map((chart, idx) => {
        const Icon = chart.icon
        const latest = data.length > 0 ? (data[data.length - 1]?.[chart.key]?.toFixed(1) || '0.0') : '0.0'

        return (
          <div
            key={chart.key}
            className="flex flex-col px-3 py-2"
            style={{
              borderRight: idx < 2 ? '1px solid var(--color-border-subtle)' : 'none',
            }}
          >
            {/* Chart Header */}
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1.5">
                <div
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ background: chart.color }}
                />
                <span className="text-[11px] font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                  {chart.label}
                </span>
              </div>
              <span className="text-xs font-semibold" style={{ color: chart.color, fontFamily: 'var(--font-mono)' }}>
                {latest} <span style={{ color: 'var(--color-text-muted)', fontSize: '9px' }}>{chart.unit}</span>
              </span>
            </div>

            {/* Chart */}
            <div className="flex-1" style={{ minHeight: '80px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: -16 }}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(42, 53, 72, 0.5)"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="t"
                    tick={false}
                    axisLine={{ stroke: 'var(--color-border-subtle)' }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 9, fill: 'var(--color-text-muted)' }}
                    axisLine={false}
                    tickLine={false}
                    width={35}
                    domain={['auto', 'auto']}
                  />
                  <Tooltip
                    contentStyle={{
                      background: 'var(--color-bg-raised)',
                      border: '1px solid var(--color-border-default)',
                      borderRadius: '8px',
                      fontSize: '11px',
                      color: 'var(--color-text-primary)',
                      padding: '6px 10px',
                    }}
                    itemStyle={{ color: chart.color }}
                    cursor={{ stroke: 'rgba(255,255,255,0.1)' }}
                  />
                  <Line
                    type="monotone"
                    dataKey={chart.key}
                    stroke={chart.color}
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 3, strokeWidth: 0, fill: chart.color }}
                    isAnimationActive={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function CollisionsView({ collisions = [] }) {
  return (
    <div className="overflow-auto h-full px-3 py-2">
      <table className="w-full text-xs">
        <thead>
          <tr style={{ color: 'var(--color-text-muted)' }}>
            <th className="text-left py-1.5 font-medium">Time</th>
            <th className="text-left py-1.5 font-medium">Body A</th>
            <th className="text-left py-1.5 font-medium">Body B</th>
            <th className="text-right py-1.5 font-medium">Impact Speed</th>
          </tr>
        </thead>
        <tbody>
          {collisions.length === 0 ? (
            <tr>
              <td colSpan={4} className="py-6 text-center" style={{ color: 'var(--color-text-muted)' }}>
                No collisions yet — start the simulation
              </td>
            </tr>
          ) : (
            collisions.map((c) => (
              <tr
                key={c.id}
                className="transition-colors duration-100"
                style={{ borderBottom: '1px solid var(--color-border-subtle)' }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-bg-hover)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <td className="py-1.5" style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>{c.time}</td>
                <td className="py-1.5" style={{ color: 'var(--color-text-secondary)' }}>{c.bodyA}</td>
                <td className="py-1.5" style={{ color: 'var(--color-text-secondary)' }}>{c.bodyB}</td>
                <td className="py-1.5 text-right" style={{ color: 'var(--color-accent)', fontFamily: 'var(--font-mono)' }}>{c.speed}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
