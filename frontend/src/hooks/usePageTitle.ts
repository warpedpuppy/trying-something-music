/**
 * usePageTitle — sets document.title and meta descriptions for the current
 * page and restores site-level defaults when the component unmounts.
 *
 * Usage:
 *   usePageTitle('About')
 *   → "About — Trying Something"
 *
 *   usePageTitle('Play Along', 'Sheet music scrolls at a steady tempo — tap along and feel the rhythm.')
 *   → also updates <meta name="description">, og:description, twitter:description
 *
 * For pages whose title depends on async data (e.g. ExercisePlayer), pass
 * a fallback string until the data arrives:
 *   usePageTitle(exercise?.title ?? 'Exercise')
 */

import { useEffect } from 'react'

const SITE = 'Trying Something'
const DEFAULT_TITLE = `${SITE} — Rhythm Trainer`
const DEFAULT_DESC = 'Practice reading sheet music rhythms. Tap exercises, get instant feedback, and build your musical skills step by step.'

export function usePageTitle(title: string, description?: string): void {
  useEffect(() => {
    const prevTitle = document.title
    document.title = `${title} — ${SITE}`

    if (!description) return () => { document.title = prevTitle || DEFAULT_TITLE }

    const metas = [
      document.querySelector<HTMLMetaElement>('meta[name="description"]'),
      document.querySelector<HTMLMetaElement>('meta[property="og:description"]'),
      document.querySelector<HTMLMetaElement>('meta[name="twitter:description"]'),
    ]
    const prevDescs = metas.map(m => m?.getAttribute('content') ?? DEFAULT_DESC)
    metas.forEach(m => m?.setAttribute('content', description))

    return () => {
      document.title = prevTitle || DEFAULT_TITLE
      metas.forEach((m, i) => m?.setAttribute('content', prevDescs[i]))
    }
  }, [title, description])
}
