import { useState } from 'react'
import { useUIStore } from '../../stores/uiStore'
import { TEMPLATES, getDifficultyColor } from '../../data/templates'
import { X, Search, FlaskConical, BookOpen, Play, Tag } from 'lucide-react'

/**
 * ExperimentGallery — Browse, search, and load experiment templates
 */
export default function ExperimentGallery({ onLoadExperiment }) {
  const { activeModal, closeModal } = useUIStore()
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')

  if (activeModal !== 'experiments') return null

  const categories = [
    { id: 'all', label: 'All' },
    { id: 'mechanics', label: 'Mechanics' },
    { id: 'thermodynamics', label: 'Thermo' },
    { id: 'waves', label: 'Waves' },
  ]

  const filtered = TEMPLATES.filter(t => {
    const matchSearch = !search ||
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.tags.some(tag => tag.includes(search.toLowerCase()))
    const matchCategory = selectedCategory === 'all' || t.category === selectedCategory
    return matchSearch && matchCategory
  })

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50"
      style={{ background: 'rgba(8, 12, 18, 0.7)', backdropFilter: 'blur(6px)' }}
      onClick={closeModal}
    >
      <div
        className="w-full max-w-2xl max-h-[85vh] rounded-2xl overflow-hidden flex flex-col animate-slide-up"
        style={{
          background: 'var(--color-bg-surface)',
          border: '1px solid var(--color-border-default)',
          boxShadow: '0 24px 48px rgba(0,0,0,0.4)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4 border-b shrink-0"
          style={{ borderColor: 'var(--color-border-subtle)' }}
        >
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: 'rgba(192, 132, 252, 0.15)' }}
            >
              <FlaskConical size={16} style={{ color: '#c084fc' }} />
            </div>
            <div>
              <h2 className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                Experiment Library
              </h2>
              <p className="text-[11px]" style={{ color: 'var(--color-text-muted)' }}>
                {TEMPLATES.length} pre-built experiments ready to load
              </p>
            </div>
          </div>
          <button
            onClick={closeModal}
            className="p-1.5 rounded-lg transition-colors"
            style={{ background: 'transparent', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer' }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Search + Filters */}
        <div
          className="px-6 py-3 border-b shrink-0 flex flex-col gap-2"
          style={{ borderColor: 'var(--color-border-subtle)' }}
        >
          {/* Search bar */}
          <div className="relative">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2"
              style={{ color: 'var(--color-text-muted)' }}
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search experiments..."
              className="w-full pl-9 pr-3 py-2 rounded-xl text-sm outline-none transition-colors"
              style={{
                background: 'var(--color-bg-raised)',
                border: '1px solid var(--color-border-default)',
                color: 'var(--color-text-primary)',
              }}
            />
          </div>
          {/* Category pills */}
          <div className="flex gap-1">
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className="px-3 py-1 rounded-full text-[11px] font-medium transition-all"
                style={{
                  background: selectedCategory === cat.id ? 'var(--color-accent-muted)' : 'var(--color-bg-raised)',
                  color: selectedCategory === cat.id ? 'var(--color-accent)' : 'var(--color-text-muted)',
                  border: selectedCategory === cat.id ? '1px solid rgba(232,168,76,0.3)' : '1px solid transparent',
                  cursor: 'pointer',
                }}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Experiment Grid */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12" style={{ opacity: 0.5 }}>
              <BookOpen size={32} style={{ color: 'var(--color-text-muted)' }} />
              <p className="text-xs mt-3" style={{ color: 'var(--color-text-muted)' }}>No experiments match your search</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {filtered.map(experiment => {
                const diff = getDifficultyColor(experiment.difficulty)
                return (
                  <button
                    key={experiment.id}
                    onClick={() => {
                      onLoadExperiment(experiment)
                      closeModal()
                    }}
                    className="group flex flex-col text-left rounded-xl p-4 transition-all duration-200"
                    style={{
                      background: 'var(--color-bg-raised)',
                      border: '1px solid var(--color-border-subtle)',
                      cursor: 'pointer',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'var(--color-accent)'
                      e.currentTarget.style.transform = 'translateY(-1px)'
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'var(--color-border-subtle)'
                      e.currentTarget.style.transform = 'translateY(0)'
                      e.currentTarget.style.boxShadow = 'none'
                    }}
                  >
                    {/* Top row: icon + difficulty */}
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xl">{experiment.icon}</span>
                      <span
                        className="text-[9px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full"
                        style={{ background: diff.bg, color: diff.color }}
                      >
                        {experiment.difficulty}
                      </span>
                    </div>

                    {/* Title */}
                    <h3
                      className="text-sm font-semibold mb-1"
                      style={{ color: 'var(--color-text-primary)' }}
                    >
                      {experiment.title}
                    </h3>

                    {/* Description */}
                    <p
                      className="text-[11px] leading-relaxed mb-3 line-clamp-2"
                      style={{ color: 'var(--color-text-muted)' }}
                    >
                      {experiment.description}
                    </p>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-1 mt-auto">
                      {experiment.tags.slice(0, 3).map(tag => (
                        <span
                          key={tag}
                          className="flex items-center gap-0.5 text-[9px] px-1.5 py-0.5 rounded-md"
                          style={{ background: 'var(--color-bg-hover)', color: 'var(--color-text-muted)' }}
                        >
                          <Tag size={8} />
                          {tag}
                        </span>
                      ))}
                    </div>

                    {/* Load indicator on hover */}
                    <div
                      className="flex items-center gap-1 mt-3 text-[10px] font-medium opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ color: 'var(--color-accent)' }}
                    >
                      <Play size={10} />
                      Load experiment
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
