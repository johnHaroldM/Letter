import { letterConfig } from '@/data/letterConfig'

/**
 * The four chapters of the story. Section ids, numerals and labels are defined
 * once here so the section headings and the header indicator always agree.
 */
export const chapters = [
  { id: 'prelude', numeral: 'I', label: letterConfig.prelude.label },
  { id: 'memories', numeral: 'II', label: letterConfig.memories.label },
  { id: 'letter', numeral: 'III', label: letterConfig.letter.label },
  { id: 'finale', numeral: 'IV', label: letterConfig.finale.label },
] as const

export type ChapterId = (typeof chapters)[number]['id']

export function chapter(id: ChapterId) {
  return chapters.find((entry) => entry.id === id)!
}
