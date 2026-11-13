import { chapter, type ChapterId } from '@/lib/chapters'
import { cn } from '@/lib/utils'

/** The small "II ── Memories" marker that opens each section. */
export function ChapterLabel({ id, className }: { id: ChapterId; className?: string }) {
  const { numeral, label } = chapter(id)

  return (
    <p className={cn('eyebrow flex items-center gap-4', className)}>
      <span className="font-serif text-lg font-normal normal-case italic leading-none tracking-normal">{numeral}</span>
      <span className="h-px w-10 bg-current opacity-40" aria-hidden="true" />
      <span>{label}</span>
    </p>
  )
}
