import { useState } from 'react'

export interface DisclaimerState {
  status: 'never' | 'acknowledged'
  /** ISO date, only set when status === 'acknowledged'. */
  acknowledgedAt?: string
}

const ACK_TTL_MS = 24 * 60 * 60 * 1000

function readState(key: string): DisclaimerState | null {
  try {
    const raw = window.localStorage.getItem(key)
    if (!raw) return null
    return JSON.parse(raw) as DisclaimerState
  } catch {
    return null
  }
}

function shouldShow(state: DisclaimerState | null): boolean {
  if (!state) return true
  if (state.status === 'never') return false
  if (!state.acknowledgedAt) return true
  return Date.now() - new Date(state.acknowledgedAt).getTime() >= ACK_TTL_MS
}

function writeState(key: string, state: DisclaimerState) {
  try {
    window.localStorage.setItem(key, JSON.stringify(state))
  } catch {
    // ignore: device-level preference, not critical if it doesn't persist
  }
}

/**
 * Drives the "Ce site a pour vocation..." disclaimer modal for one section
 * (Mon dossier or Mon oral). Device-level state, not part of the versioned
 * export/import data — matches how the light/dark theme is stored.
 */
export function useDisclaimer(key: string) {
  const [visible, setVisible] = useState(() => shouldShow(readState(key)))

  const dismissForever = () => {
    writeState(key, { status: 'never' })
    setVisible(false)
  }

  const acknowledge = () => {
    writeState(key, { status: 'acknowledged', acknowledgedAt: new Date().toISOString() })
    setVisible(false)
  }

  return { visible, dismissForever, acknowledge }
}
