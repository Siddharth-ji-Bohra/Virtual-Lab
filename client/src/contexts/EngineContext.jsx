import { createContext, useContext, useRef } from 'react'

/**
 * EngineContext — Shares Matter.js engine reference across components
 * So PropertyPanel can call Body.set() on the real physics body
 */
const EngineContext = createContext(null)

export function EngineProvider({ children }) {
  const engineRef = useRef(null)
  const renderRef = useRef(null)

  return (
    <EngineContext.Provider value={{ engineRef, renderRef }}>
      {children}
    </EngineContext.Provider>
  )
}

export function useEngine() {
  return useContext(EngineContext)
}
