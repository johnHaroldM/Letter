import { useCallback, useSyncExternalStore } from 'react'

/** Subscribe to a CSS media query. Correct on the very first render. */
export function useMediaQuery(query: string) {
  const subscribe = useCallback(
    (notify: () => void) => {
      const list = window.matchMedia(query)
      list.addEventListener('change', notify)
      return () => list.removeEventListener('change', notify)
    },
    [query],
  )

  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => false,
  )
}

/** True when the visitor has asked their system to minimise motion. */
export function usePrefersReducedMotion() {
  return useMediaQuery('(prefers-reduced-motion: reduce)')
}

/** True for a mouse or trackpad; false for touch screens. */
export function useFinePointer() {
  return useMediaQuery('(hover: hover) and (pointer: fine)')
}
