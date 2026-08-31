import { useCallback, useEffect, useState } from 'react'

function readValue<T>(key: string, initialValue: T): T {
  if (typeof window === 'undefined') return initialValue
  try {
    const item = window.localStorage.getItem(key)
    return item ? (JSON.parse(item) as T) : initialValue
  } catch (error) {
    console.warn(`Impossible de lire "${key}" depuis le localStorage`, error)
    return initialValue
  }
}

/** Persists state to localStorage under `key`, and keeps tabs of the same browser in sync. */
export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => readValue(key, initialValue))

  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      setStoredValue((prev) => {
        const next = value instanceof Function ? value(prev) : value
        try {
          window.localStorage.setItem(key, JSON.stringify(next))
          window.dispatchEvent(new CustomEvent('macertif:storage', { detail: { key } }))
        } catch (error) {
          console.warn(`Impossible d'écrire "${key}" dans le localStorage`, error)
        }
        return next
      })
    },
    [key],
  )

  useEffect(() => {
    const handleStorageEvent = (event: StorageEvent) => {
      if (event.key === key) setStoredValue(readValue(key, initialValue))
    }
    const handleLocalChange = () => setStoredValue(readValue(key, initialValue))
    window.addEventListener('storage', handleStorageEvent)
    window.addEventListener('macertif:storage', handleLocalChange)
    return () => {
      window.removeEventListener('storage', handleStorageEvent)
      window.removeEventListener('macertif:storage', handleLocalChange)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  return [storedValue, setValue] as const
}
