/**
 * TypeScript port of backend/app/services/progression.py
 * Adaptive level unlocks, concept mastery, and remediation — all in localStorage.
 */

import type { Exercise } from '../api/types'
import {
  addAttempt,
  getAttempts,
  getMastery,
  getProgress,
  getRemediation,
  nextExerciseId,
  saveCustomExercises,
  getCustomExercises,
  saveMastery,
  saveProgress,
  saveRemediation,
} from './localDb'
import { tapCount } from './rhythm'
import { SEED_EXERCISES } from '../data/exercises'

const PASSES_TO_UNLOCK = 2
const CONSECUTIVE_FAILS_FOR_REMEDIATION = 3
const REMEDIATION_PASSES_REQUIRED = 2

export interface OutcomeSummary {
  newlyUnlockedLevel: number | null
  remediationStarted: boolean
  remediationActive: boolean
  remediationCompleted: boolean
  message: string
}

export function allExercises(): Exercise[] {
  const custom = getCustomExercises().map((c) => c as unknown as Exercise)
  return [...SEED_EXERCISES, ...custom].filter((e) => e.is_active)
}

export function maxLevel(): number {
  return Math.max(...allExercises().map((e) => e.level), 1)
}

/**
 * Advance unlockedLevel past any levels where all exercises are already passed.
 *
 * This handles the case where new exercises are added to a level above the
 * user's previous maximum: they completed the old max level when it was the
 * ceiling, so checkLevelUnlock never ticked them forward. Calling this at the
 * start of nextExercise() and listExercises() keeps the state correct.
 */
export function catchUpLevel(userId: number): void {
  const progress = getProgress(userId)
  const passed = passedExerciseIds(userId)
  const highest = maxLevel()
  let changed = false

  while (progress.unlockedLevel < highest) {
    const atLevel = allExercises().filter((e) => e.level === progress.unlockedLevel)
    // If every exercise at this level is passed (or there are none), advance.
    if (atLevel.length === 0 || atLevel.every((e) => passed.has(e.id))) {
      progress.unlockedLevel++
      changed = true
    } else {
      break
    }
  }

  if (changed) saveProgress(userId, progress)
}

function passedExerciseIds(userId: number): Set<number> {
  return new Set(
    getAttempts(userId)
      .filter((a) => a.passed)
      .map((a) => a.exerciseId),
  )
}

function consecutiveFailures(userId: number, exerciseId: number): number {
  const attempts = getAttempts(userId)
    .filter((a) => a.exerciseId === exerciseId)
    .reverse()
  let count = 0
  for (const a of attempts) {
    if (a.passed) break
    count++
  }
  return count
}

function remediationCandidates(userId: number, source: Exercise): Exercise[] {
  const passed = passedExerciseIds(userId)
  return allExercises()
    .filter(
      (e) =>
        e.concept === source.concept &&
        e.level <= source.level &&
        e.id !== source.id &&
        !passed.has(e.id),
    )
    .sort((a, b) => b.level - a.level || a.id - b.id)
}

export function recordAttempt(
  userId: number,
  exercise: Exercise,
  tapsMs: number[],
  gaveUp: boolean,
  mode: 'free' | 'strict',
  accuracy: number,
  passed: boolean,
): { attemptId: number; outcome: OutcomeSummary } {
  const attempt = addAttempt(userId, { exerciseId: exercise.id, tapsMs, passed, gaveUp, mode, accuracy })

  const summary: OutcomeSummary = {
    newlyUnlockedLevel: null,
    remediationStarted: false,
    remediationActive: false,
    remediationCompleted: false,
    message: '',
  }

  const mastery = getMastery(userId)
  const cm = mastery[exercise.concept] ?? { passes: 0, fails: 0 }
  const remediation = getRemediation(userId)
  const messages: string[] = []

  if (passed) {
    cm.passes++
    if (
      remediation?.active &&
      remediation.concept === exercise.concept &&
      remediation.sourceExerciseId !== exercise.id
    ) {
      remediation.completedPasses++
      if (remediation.completedPasses >= REMEDIATION_PASSES_REQUIRED) {
        remediation.active = false
        summary.remediationCompleted = true
        messages.push(
          "Great work — you've practiced this concept enough. Time to go back to the exercise you were stuck on.",
        )
        saveRemediation(userId, remediation)
      } else {
        saveRemediation(userId, remediation)
      }
    }
    if (remediation?.active && remediation.sourceExerciseId === exercise.id) {
      remediation.active = false
      summary.remediationCompleted = true
      messages.push('You beat the exercise you were stuck on!')
      saveRemediation(userId, remediation)
    }

    const unlocked = checkLevelUnlock(userId, exercise)
    if (unlocked !== null) {
      summary.newlyUnlockedLevel = unlocked
      messages.push(`Level ${unlocked} unlocked!`)
    }
  } else {
    cm.fails++
    const fails = consecutiveFailures(userId, exercise.id)
    if (fails >= CONSECUTIVE_FAILS_FOR_REMEDIATION && !remediation?.active) {
      const candidates = remediationCandidates(userId, exercise)
      if (candidates.length > 0) {
        saveRemediation(userId, {
          id: Date.now(),
          sourceExerciseId: exercise.id,
          concept: exercise.concept,
          completedPasses: 0,
          active: true,
        })
        summary.remediationStarted = true
        messages.push(
          "This one is giving you trouble — let's practice some similar rhythms first and come back to it.",
        )
      }
    }
  }

  mastery[exercise.concept] = cm
  saveMastery(userId, mastery)

  const currentRemediation = getRemediation(userId)
  summary.remediationActive = currentRemediation?.active ?? false
  summary.message = messages.join(' ')

  return { attemptId: attempt.id, outcome: summary }
}

function checkLevelUnlock(userId: number, exercise: Exercise): number | null {
  const progress = getProgress(userId)
  if (exercise.level !== progress.unlockedLevel) return null
  const highest = maxLevel()
  if (progress.unlockedLevel >= highest) return null

  const attempts = getAttempts(userId)
  const passedAtLevel = new Set(
    attempts
      .filter((a) => a.passed)
      .map((a) => a.exerciseId)
      .filter((eid) => {
        const ex = allExercises().find((e) => e.id === eid)
        return ex?.level === progress.unlockedLevel
      }),
  ).size

  if (passedAtLevel >= PASSES_TO_UNLOCK) {
    progress.unlockedLevel++
    saveProgress(userId, progress)
    return progress.unlockedLevel
  }
  return null
}

export function nextExercise(
  userId: number,
): { exercise: Exercise | null; reason: 'progression' | 'remediation' | 'complete'; message: string } {
  catchUpLevel(userId)
  const progress = getProgress(userId)
  const passed = passedExerciseIds(userId)
  const remediation = getRemediation(userId)

  if (remediation?.active) {
    const source = allExercises().find((e) => e.id === remediation.sourceExerciseId)
    if (source) {
      const candidates = remediationCandidates(userId, source)
      if (candidates.length > 0) {
        const remaining = REMEDIATION_PASSES_REQUIRED - remediation.completedPasses
        return {
          exercise: candidates[0],
          reason: 'remediation',
          message: `Let's practice a similar rhythm. Pass ${remaining} more like this and we'll go back to "${source.title}".`,
        }
      }
    }
    // No candidates left — close remediation and fall through
    if (remediation) {
      remediation.active = false
      saveRemediation(userId, remediation)
    }
  }

  // Check if a recently completed remediation should send us back to the source
  const allRem = getRemediation(userId)
  if (allRem && !allRem.active && allRem.completedPasses >= REMEDIATION_PASSES_REQUIRED) {
    const source = allExercises().find((e) => e.id === allRem.sourceExerciseId)
    if (source && !passed.has(source.id)) {
      return {
        exercise: source,
        reason: 'progression',
        message: 'You\'ve warmed up — time to retry the exercise you were stuck on.',
      }
    }
  }

  const candidates = allExercises()
    .filter((e) => e.level <= progress.unlockedLevel)
    .sort((a, b) => a.level - b.level || a.id - b.id)

  for (const exercise of candidates) {
    if (!passed.has(exercise.id)) {
      return { exercise, reason: 'progression', message: "Here's your next exercise." }
    }
  }

  return { exercise: null, reason: 'complete', message: "You've passed every unlocked exercise. Nice work!" }
}

// Admin: create a custom exercise
export function createCustomExercise(payload: Omit<Exercise, 'id' | 'tap_count'>): Exercise {
  const id = nextExerciseId() + 1000 // offset to avoid collisions with seed IDs
  const exercise: Exercise = { ...payload, id, tap_count: tapCount(payload.pattern) }
  const customs = getCustomExercises()
  customs.push(exercise as unknown as ReturnType<typeof getCustomExercises>[0])
  saveCustomExercises(customs)
  return exercise
}

export function updateCustomExercise(id: number, payload: Omit<Exercise, 'id' | 'tap_count'>): Exercise | null {
  const customs = getCustomExercises()
  const idx = customs.findIndex((e) => e.id === id)
  if (idx === -1) return null
  const updated = { ...payload, id, tap_count: tapCount(payload.pattern) } as unknown as typeof customs[0]
  customs[idx] = updated
  saveCustomExercises(customs)
  return updated as unknown as Exercise
}

export function deleteCustomExercise(id: number): void {
  const customs = getCustomExercises().filter((e) => e.id !== id)
  saveCustomExercises(customs)
}

export function skipToLevel(userId: number, targetLevel: number): void {
  const progress = getProgress(userId)
  if (targetLevel > progress.unlockedLevel) {
    progress.unlockedLevel = targetLevel
    saveProgress(userId, progress)
  }
}
