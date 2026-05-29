/**
 * usePageTitle — sets document.title for the current page and restores
 * the site-level default when the component unmounts.
 *
 * Usage:
 *   usePageTitle('About')
 *   → "About — Trying Something"
 *
 * For pages whose title depends on async data (e.g. ExercisePlayer), pass
 * a fallback string until the data arrives:
 *   usePageTitle(exercise?.title ?? 'Exercise')
 */

import { useEffect } from 'react'

const SITE = 'Trying Something'
const DEFAULT_TITLE = `${SITE} — Rhythm Trainer`

export function usePageTitle(title: string): void {
  useEffect(() => {
    const prev = document.title
    document.title = `${title} — ${SITE}`
    return () => { document.title = prev || DEFAULT_TITLE }
  }, [title])
}
