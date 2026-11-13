import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/** Compose class names. Later Tailwind utilities win over earlier ones. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Resolve an asset path from letterConfig against the deployed base URL, so
 * "memories/photo.jpg" works whether the site lives at the domain root or in a
 * sub-folder. Full URLs pass through untouched.
 */
export function resolveAsset(src: string) {
  if (/^([a-z]+:)?\/\//i.test(src) || /^(data|blob):/i.test(src)) return src
  return `${import.meta.env.BASE_URL}${src.replace(/^\.?\/+/, '')}`
}

/** The shared "settle" curve: fast out of the gate, long gentle landing. */
export const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const
