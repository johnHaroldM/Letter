import { Fragment } from 'react'
import { cn } from '@/lib/utils'

interface Word {
  text: string
  emphasis: boolean
}

/** Splits text into words, tracking which ones sit inside *asterisks*. */
function parseWords(source: string): Word[] {
  const words: Word[] = []
  let emphasis = false

  for (const raw of source.trim().split(/\s+/)) {
    let text = raw
    if (text.startsWith('*')) {
      emphasis = true
      text = text.slice(1)
    }
    const closes = text.endsWith('*')
    if (closes) text = text.slice(0, -1)
    if (text) words.push({ text, emphasis })
    if (closes) emphasis = false
  }

  return words
}

/**
 * Renders text as individually masked words, ready to be animated:
 * each `.word` can slide up from behind its own `.word-mask`.
 *
 * Screen readers get the sentence once, as plain text.
 */
export function SplitWords({ text }: { text: string }) {
  const words = parseWords(text)

  return (
    <>
      <span className="sr-only">{text.replace(/\*/g, '')}</span>
      <span aria-hidden="true">
        {words.map((word, index) => (
          <Fragment key={index}>
            <span className="word-mask">
              <span className={cn('word', word.emphasis && 'word-em')}>{word.text}</span>
            </span>
            {index < words.length - 1 ? ' ' : null}
          </Fragment>
        ))}
      </span>
    </>
  )
}
