import { useSyncExternalStore } from "react"
import {
  SESSION_CHANGE_EVENT,
  getServerSessionSnapshot,
  getSessionSnapshot,
  type SessionSnapshot,
} from "../lib/session"

function subscribeSession(onChange: () => void) {
  window.addEventListener(SESSION_CHANGE_EVENT, onChange)

  return () => {
    window.removeEventListener(SESSION_CHANGE_EVENT, onChange)
  }
}

export function useSession(): SessionSnapshot {
  return useSyncExternalStore(
    subscribeSession,
    getSessionSnapshot,
    getServerSessionSnapshot,
  )
}
