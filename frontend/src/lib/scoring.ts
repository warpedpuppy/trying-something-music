/**
 * TypeScript port of backend/app/services/scoring.py
 * Free-tempo and strict-tempo tap scoring.
 */

import type { NoteResult, Verdict } from '../api/types'

const ON_TIME_WINDOW = 0.25
const CLOSE_WINDOW = 0.5
export const PASS_THRESHOLD = 0.8

export interface ScoreResult {
  noteResults: NoteResult[]
  accuracy: number
  passed: boolean
  inferredMsPerBeat: number | null
}

function verdict(deviation: number): Verdict {
  if (Math.abs(deviation) <= ON_TIME_WINDOW) return 'on_time'
  if (Math.abs(deviation) <= CLOSE_WINDOW) return deviation < 0 ? 'early' : 'late'
  return 'wrong'
}

function allMissed(expectedBeats: number[]): ScoreResult {
  return {
    noteResults: expectedBeats.map((b, i) => ({
      index: i,
      expected_beat: b,
      actual_beat: null,
      deviation_beats: null,
      verdict: 'missed',
    })),
    accuracy: 0,
    passed: false,
    inferredMsPerBeat: null,
  }
}

function inferMsPerBeat(expectedBeats: number[], tapsMs: number[]): number | null {
  const n = Math.min(expectedBeats.length, tapsMs.length)
  if (n < 2) return null
  const beatSpan = expectedBeats[n - 1] - expectedBeats[0]
  const timeSpan = tapsMs[n - 1] - tapsMs[0]
  if (beatSpan <= 0 || timeSpan <= 0) return null
  return timeSpan / beatSpan
}

export function scoreTapsFree(expectedBeats: number[], tapsMs: number[]): ScoreResult {
  if (expectedBeats.length === 0) {
    return { noteResults: [], accuracy: 0, passed: false, inferredMsPerBeat: null }
  }
  if (tapsMs.length === 0) return allMissed(expectedBeats)

  if (expectedBeats.length === 1) {
    return {
      noteResults: [{ index: 0, expected_beat: expectedBeats[0], actual_beat: expectedBeats[0], deviation_beats: 0, verdict: 'on_time' }],
      accuracy: 1,
      passed: true,
      inferredMsPerBeat: null,
    }
  }

  const msPerBeat = inferMsPerBeat(expectedBeats, tapsMs)
  const b0 = expectedBeats[0]
  const t0 = tapsMs[0]

  const noteResults: NoteResult[] = expectedBeats.map((expected, i) => {
    if (i >= tapsMs.length) {
      return { index: i, expected_beat: expected, actual_beat: null, deviation_beats: null, verdict: 'missed' as Verdict }
    }
    if (i === 0) {
      return { index: 0, expected_beat: expected, actual_beat: expected, deviation_beats: 0, verdict: 'on_time' as Verdict }
    }
    if (msPerBeat === null) {
      return { index: i, expected_beat: expected, actual_beat: null, deviation_beats: null, verdict: 'wrong' as Verdict }
    }
    const actual = b0 + (tapsMs[i] - t0) / msPerBeat
    const dev = actual - expected
    return {
      index: i,
      expected_beat: expected,
      actual_beat: Math.round(actual * 10000) / 10000,
      deviation_beats: Math.round(dev * 10000) / 10000,
      verdict: verdict(dev),
    }
  })

  const accuracy = Math.round((noteResults.filter((n) => n.verdict === 'on_time').length / noteResults.length) * 10000) / 10000
  return { noteResults, accuracy, passed: accuracy >= PASS_THRESHOLD, inferredMsPerBeat: msPerBeat }
}

export function scoreTapsStrict(expectedBeats: number[], tapsMs: number[], msPerBeat: number): ScoreResult {
  if (expectedBeats.length === 0) {
    return { noteResults: [], accuracy: 0, passed: false, inferredMsPerBeat: msPerBeat }
  }
  if (tapsMs.length === 0) {
    return { ...allMissed(expectedBeats), inferredMsPerBeat: msPerBeat }
  }

  const noteResults: NoteResult[] = expectedBeats.map((expected, i) => {
    if (i >= tapsMs.length) {
      return { index: i, expected_beat: expected, actual_beat: null, deviation_beats: null, verdict: 'missed' as Verdict }
    }
    const actual = tapsMs[i] / msPerBeat
    const dev = actual - expected
    return {
      index: i,
      expected_beat: expected,
      actual_beat: Math.round(actual * 10000) / 10000,
      deviation_beats: Math.round(dev * 10000) / 10000,
      verdict: verdict(dev),
    }
  })

  const accuracy = Math.round((noteResults.filter((n) => n.verdict === 'on_time').length / noteResults.length) * 10000) / 10000
  return { noteResults, accuracy, passed: accuracy >= PASS_THRESHOLD, inferredMsPerBeat: msPerBeat }
}
