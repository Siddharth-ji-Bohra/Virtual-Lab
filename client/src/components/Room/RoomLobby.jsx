import { useState } from 'react'
import { useRoomStore } from '../../stores/roomStore'
import { useUIStore } from '../../stores/uiStore'
import { Users, Plus, LogIn, Copy, X, Wifi, WifiOff } from 'lucide-react'

/**
 * RoomLobby — Modal for creating and joining collaborative rooms
 */
export default function RoomLobby({ onJoinRoom, onLeaveRoom, isConnected }) {
  const { activeModal, closeModal } = useUIStore()
  const { roomId, roomName, roomCode, users } = useRoomStore()
  const [joinCode, setJoinCode] = useState('')
  const [newRoomName, setNewRoomName] = useState('')
  const [tab, setTab] = useState('join') // join | create
  const [copied, setCopied] = useState(false)

  if (activeModal !== 'share') return null

  const handleJoin = () => {
    if (joinCode.trim()) {
      onJoinRoom(joinCode.trim())
      setJoinCode('')
    }
  }

  const handleCreate = () => {
    const code = Math.random().toString(36).substring(2, 8)
    onJoinRoom(code, newRoomName || 'Untitled Lab')
    setNewRoomName('')
  }

  const handleCopyCode = () => {
    if (roomCode) {
      navigator.clipboard.writeText(roomCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50"
      style={{ background: 'rgba(8, 12, 18, 0.7)', backdropFilter: 'blur(6px)' }}
      onClick={closeModal}
    >
      <div
        className="w-full max-w-md rounded-2xl overflow-hidden animate-slide-up"
        style={{
          background: 'var(--color-bg-surface)',
          border: '1px solid var(--color-border-default)',
          boxShadow: '0 24px 48px rgba(0,0,0,0.4)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4 border-b"
          style={{ borderColor: 'var(--color-border-subtle)' }}
        >
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: 'var(--color-accent-muted)' }}
            >
              <Users size={16} style={{ color: 'var(--color-accent)' }} />
            </div>
            <div>
              <h2 className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                Collaborate
              </h2>
              <p className="text-[11px]" style={{ color: 'var(--color-text-muted)' }}>
                Work together in real-time
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

        {/* Connected to room — show room info */}
        {roomCode ? (
          <div className="p-6">
            {/* Room info card */}
            <div
              className="rounded-xl p-4 mb-4"
              style={{ background: 'var(--color-bg-raised)', border: '1px solid var(--color-border-subtle)' }}
            >
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>Room Code</p>
                  <p className="text-lg font-bold tracking-wider" style={{ color: 'var(--color-text-primary)', fontFamily: 'var(--font-mono)' }}>
                    {roomCode}
                  </p>
                </div>
                <button
                  onClick={handleCopyCode}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                  style={{
                    background: copied ? 'var(--color-success-muted)' : 'var(--color-bg-hover)',
                    color: copied ? 'var(--color-success)' : 'var(--color-text-secondary)',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  <Copy size={12} />
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>

              {/* Connection status */}
              <div className="flex items-center gap-1.5 mb-3">
                {isConnected ? (
                  <>
                    <Wifi size={12} style={{ color: 'var(--color-success)' }} />
                    <span className="text-[11px]" style={{ color: 'var(--color-success)' }}>Connected</span>
                  </>
                ) : (
                  <>
                    <WifiOff size={12} style={{ color: 'var(--color-danger)' }} />
                    <span className="text-[11px]" style={{ color: 'var(--color-danger)' }}>Disconnected</span>
                  </>
                )}
              </div>

              {/* Users in room */}
              <p className="text-[11px] font-medium mb-2" style={{ color: 'var(--color-text-muted)' }}>
                {users.length} user{users.length !== 1 ? 's' : ''} in room
              </p>
              <div className="flex flex-wrap gap-2">
                {users.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center gap-1.5 px-2 py-1 rounded-md"
                    style={{ background: 'var(--color-bg-hover)' }}
                  >
                    <div
                      className="w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold"
                      style={{ background: user.avatarColor || '#60a5fa', color: '#fff' }}
                    >
                      {(user.username || 'U')[0].toUpperCase()}
                    </div>
                    <span className="text-[11px]" style={{ color: 'var(--color-text-secondary)' }}>
                      {user.username}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => { onLeaveRoom(); }}
              className="w-full py-2.5 rounded-xl text-xs font-semibold transition-colors"
              style={{
                background: 'var(--color-danger-muted)',
                color: 'var(--color-danger)',
                border: '1px solid rgba(248,113,113,0.2)',
                cursor: 'pointer',
              }}
            >
              Leave Room
            </button>
          </div>
        ) : (
          /* Not in a room — show join/create */
          <div className="p-6">
            {/* Tabs */}
            <div
              className="flex rounded-lg mb-5 p-0.5"
              style={{ background: 'var(--color-bg-raised)' }}
            >
              {['join', 'create'].map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className="flex-1 py-2 rounded-md text-xs font-semibold capitalize transition-all"
                  style={{
                    background: tab === t ? 'var(--color-bg-hover)' : 'transparent',
                    color: tab === t ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
                    border: 'none',
                    cursor: 'pointer',
                    boxShadow: tab === t ? '0 1px 3px rgba(0,0,0,0.2)' : 'none',
                  }}
                >
                  {t === 'join' ? 'Join Room' : 'Create Room'}
                </button>
              ))}
            </div>

            {tab === 'join' ? (
              <div>
                <label className="block text-[11px] font-medium mb-1.5" style={{ color: 'var(--color-text-muted)' }}>
                  Room Code
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toLowerCase())}
                    onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
                    placeholder="Enter room code..."
                    className="flex-1 px-3 py-2.5 rounded-xl text-sm outline-none transition-colors"
                    style={{
                      background: 'var(--color-bg-raised)',
                      border: '1px solid var(--color-border-default)',
                      color: 'var(--color-text-primary)',
                      fontFamily: 'var(--font-mono)',
                    }}
                  />
                  <button
                    onClick={handleJoin}
                    disabled={!joinCode.trim()}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all"
                    style={{
                      background: joinCode.trim() ? 'var(--color-accent)' : 'var(--color-bg-raised)',
                      color: joinCode.trim() ? 'var(--color-text-inverse)' : 'var(--color-text-muted)',
                      border: 'none',
                      cursor: joinCode.trim() ? 'pointer' : 'default',
                    }}
                  >
                    <LogIn size={14} />
                    Join
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-[11px] font-medium mb-1.5" style={{ color: 'var(--color-text-muted)' }}>
                  Room Name
                </label>
                <input
                  type="text"
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                  placeholder="My Physics Lab"
                  className="w-full px-3 py-2.5 rounded-xl text-sm outline-none mb-3 transition-colors"
                  style={{
                    background: 'var(--color-bg-raised)',
                    border: '1px solid var(--color-border-default)',
                    color: 'var(--color-text-primary)',
                  }}
                />
                <button
                  onClick={handleCreate}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold transition-all"
                  style={{
                    background: 'var(--color-accent)',
                    color: 'var(--color-text-inverse)',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  <Plus size={14} />
                  Create & Join Room
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
