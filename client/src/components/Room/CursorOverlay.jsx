import { useState, useEffect, useRef } from 'react'

/**
 * CursorOverlay — Renders other users' cursors on the canvas
 * Receives cursor updates from socket and renders colored pointers with names
 */
export default function CursorOverlay({ onCursorUpdate }) {
  const [cursors, setCursors] = useState({}) // { [userId]: { x, y, username, color } }
  const fadeTimers = useRef({})

  useEffect(() => {
    if (!onCursorUpdate) return

    const cleanup = onCursorUpdate(({ userId, x, y, username, avatarColor }) => {
      setCursors(prev => ({
        ...prev,
        [userId]: {
          x, y,
          username: username || `User-${userId.slice(0, 4)}`,
          color: avatarColor || `hsl(${hashCode(userId) % 360}, 55%, 50%)`,
          lastUpdate: Date.now(),
        }
      }))

      // Auto-fade after 5s of inactivity
      if (fadeTimers.current[userId]) clearTimeout(fadeTimers.current[userId])
      fadeTimers.current[userId] = setTimeout(() => {
        setCursors(prev => {
          const { [userId]: _, ...rest } = prev
          return rest
        })
      }, 5000)
    })

    return cleanup
  }, [onCursorUpdate])

  return (
    <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 20 }}>
      {Object.entries(cursors).map(([userId, cursor]) => (
        <div
          key={userId}
          className="absolute transition-all duration-100 ease-out"
          style={{
            left: cursor.x,
            top: cursor.y,
            transform: 'translate(-2px, -2px)',
          }}
        >
          {/* Cursor arrow */}
          <svg width="16" height="20" viewBox="0 0 16 20" fill="none">
            <path
              d="M1 1L6 18L8.5 10.5L15 8.5L1 1Z"
              fill={cursor.color}
              stroke="rgba(0,0,0,0.3)"
              strokeWidth="1"
            />
          </svg>
          {/* Name label */}
          <div
            className="absolute left-4 top-3 px-1.5 py-0.5 rounded text-[9px] font-medium whitespace-nowrap"
            style={{
              background: cursor.color,
              color: '#fff',
              boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
            }}
          >
            {cursor.username}
          </div>
        </div>
      ))}
    </div>
  )
}

function hashCode(str) {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash)
}
