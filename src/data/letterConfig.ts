/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  THE ONLY FILE YOU NEED TO EDIT
 * ─────────────────────────────────────────────────────────────────────────────
 *  Every name, word, date and photo on the site comes from this file.
 *
 *  Emphasis
 *    Wrap a phrase in *asterisks* to set it in rose-gold italics. It works in
 *    the opening quote, the prelude lines and the section headings. Keep the
 *    punctuation inside the asterisks:  "*Stay a while.*"
 *
 *  Photos
 *    Use any image URL, or drop your own files into /public/memories and
 *    reference them like "memories/first-date.jpg". Portrait or landscape both
 *    work; each card crops to its own frame.
 *
 *  Music
 *    Drop an mp3 into /public/audio and set music.src to "audio/our-song.mp3".
 *    Leave it empty and the sound toggle plays a soft built-in ambient pad.
 */

export interface Memory {
  /** Image URL, or a path inside /public (for example "memories/first-date.jpg"). */
  src: string
  /** A short description of the photo, read aloud by screen readers. */
  alt: string
  /** When it happened: "14 February 2023", "Summer 2022"... */
  date: string
  /** Where it happened. */
  place: string
  title: string
  caption: string
}

export interface LetterConfig {
  /** Her name, used at the gate, in the letter's greeting and in the header. */
  herName: string
  /** Your name, used for the signature and the closing credit. */
  yourName: string
  meta: {
    /** The browser tab title. */
    title: string
  }
  gate: {
    eyebrow: string
    edition: string
    /** Button label on devices with a mouse. */
    prompt: string
    /** Button label on touch devices. */
    promptTouch: string
    hint: string
  }
  openingQuote: {
    text: string
    attribution: string
  }
  prelude: {
    label: string
    /** Each line gets its own moment on screen as she scrolls. Three or four is ideal. */
    lines: string[]
    scrollHint: string
  }
  memories: {
    label: string
    heading: string
    lede: string
    /** Three or four cards look best. */
    items: Memory[]
  }
  letter: {
    label: string
    dateline: string
    /** The greeting. Her name is added after it: "My dearest Name," */
    salutation: string
    /** One string per paragraph. Write as many as you like. */
    paragraphs: string[]
    closing: string
    postscript: string
  }
  music: {
    /** Path inside /public or a full URL. Empty = built-in ambient pad. */
    src: string
    /** Shown beside the sound toggle. */
    title: string
    /** Start the song the moment she opens the letter. Only applies when `src` is set. */
    autoplay: boolean
  }
  finale: {
    label: string
    heading: string
    note: string
    /** The button, before and after the first hug. */
    button: string
    buttonAgain: string
    /** Shown one at a time after each hug. The last one repeats. */
    replies: string[]
    /** Your name is added after this line. */
    credit: string
    replay: string
  }
}

export const letterConfig: LetterConfig = {
  herName: 'My Love',
  yourName: 'Yours Truly',

  meta: {
    title: 'A letter for you',
  },

  gate: {
    eyebrow: 'A letter, sealed for you',
    edition: 'An edition of one',
    prompt: 'Click to open',
    promptTouch: 'Tap to open',
    hint: 'Best read slowly, with the sound on',
  },

  openingQuote: {
    text: 'Grow old along with me! *The best is yet to be.*',
    attribution: 'Robert Browning',
  },

  prelude: {
    label: 'Prelude',
    lines: [
      'Before anything else, *slow down.* This one is only for you.',
      'I tried to fit you into a few sentences. *You kept overflowing the page.*',
      'So I made somewhere quiet to keep the words instead. *Stay a while.*',
    ],
    scrollHint: 'Scroll to begin',
  },

  memories: {
    label: 'Memories',
    heading: 'A few moments *I keep close*',
    lede: 'Not the biggest days. Just the ones I go back to whenever I miss you.',
    items: [
      {
        src: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=1200&q=80',
        alt: 'Two cups of coffee with heart-shaped latte art on a wooden table',
        date: 'Spring 2022',
        place: 'The café on the corner',
        title: 'Where it began',
        caption: 'Two coffees gone cold, because neither of us wanted to be the one to stop talking.',
      },
      {
        src: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1400&q=80',
        alt: 'Soft waves rolling onto an empty beach at golden hour',
        date: 'Summer 2022',
        place: 'By the sea',
        title: 'The golden hour',
        caption: 'You, the tide, and a sky that would not stop showing off. I still think you won.',
      },
      {
        src: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=1400&q=80',
        alt: 'A yellow camper van on an open road between red desert cliffs',
        date: 'Autumn 2023',
        place: 'Somewhere off the map',
        title: 'The long way home',
        caption: 'We missed the turn on purpose. Best wrong direction I ever took.',
      },
      {
        src: 'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?auto=format&fit=crop&w=1200&q=80',
        alt: 'A violet night sky full of stars above a dark horizon',
        date: 'Winter 2023',
        place: 'The rooftop',
        title: 'Counting stars',
        caption: 'You were looking at the sky. I was not.',
      },
    ],
  },

  letter: {
    label: 'The Letter',
    dateline: 'Written on a quiet evening, thinking of you',
    salutation: 'My dearest',
    paragraphs: [
      'There are a hundred ways I could begin this, and I have tried most of them. The truth is simpler than any opening line I could dress up: my life is better, softer and far more interesting with you in it.',
      'I love the obvious things. Your laugh. The way your eyes give you away before you say a word. But I love the quiet things more: how you hum when you think no one is listening, how you remember the small details I mention once and forget, the particular calm that settles over a room simply because you are in it.',
      'You have made ordinary days feel like something worth keeping. A walk to nowhere, a shared meal, a long drive with the windows down. With you they stop being errands and start becoming memories. I catch myself in the middle of them thinking, remember this.',
      'I do not always find the right words when it matters, so I am leaving them here, where they cannot get lost. Thank you for your patience on my difficult days, for your courage on your own, and for choosing me, again and again, in all the small ways that no one else sees.',
      'Whatever comes next, I want to meet it beside you. Not because it will always be easy, but because there is no one I would rather figure it out with. You are my favorite hello, my hardest goodbye, and the best part of every day in between.',
    ],
    closing: 'Forever and always yours,',
    postscript: 'P.S. Keep scrolling. I left one more thing for you.',
  },

  music: {
    src: '',
    title: 'A quiet hum',
    autoplay: false,
  },

  finale: {
    label: 'Always',
    heading: 'This is not where the letter ends. *It is only where the page runs out.*',
    note: 'Thank you for reading every word. If any of it made you smile, I would love to know.',
    button: 'Send a virtual hug',
    buttonAgain: 'Send another hug',
    replies: [
      'Hug received. I felt that one from here.',
      'Another one. I am keeping all of these.',
      'Still counting. Still not enough.',
    ],
    credit: 'Written and built by hand, for you, by',
    replay: 'Read it again',
  },
}
