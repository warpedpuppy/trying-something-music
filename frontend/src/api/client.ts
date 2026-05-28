/**
 * Drop-in replacement for the HTTP API client.
 * All operations are backed by localStorage — no server required.
 */

import type {
  AdminUser,
  AdminUserDetail,
  AttemptMode,
  AttemptResult,
  Exercise,
  ExerciseListItem,
  ExercisePayload,
  NextExercise,
  ProgressSummary,
  TestRunStatus,
  TokenResponse,
  User,
} from './types'
import {
  createUser,
  findUserByUsername,
  findUserById,
  getAttempts,
  getMastery,
  getProgress,
  getRemediation,
  getSession,
  getUsers,
  setSession,
} from '../lib/localDb'
import {
  allExercises,
  catchUpLevel,
  createCustomExercise,
  deleteCustomExercise,
  maxLevel,
  nextExercise,
  recordAttempt,
  updateCustomExercise,
} from '../lib/progression'
import { expectedOnsets } from '../lib/rhythm'
import { scoreTapsFree, scoreTapsStrict } from '../lib/scoring'

// The "token" in this build is simply the userId serialised as a string.
const SESSION_TOKEN_PREFIX = 'local:'

export function getToken(): string | null {
  const session = getSession()
  return session ? `${SESSION_TOKEN_PREFIX}${session.userId}` : null
}

export function setToken(token: string | null): void {
  if (token === null) {
    setSession(null)
  } else {
    const id = parseInt(token.replace(SESSION_TOKEN_PREFIX, ''), 10)
    if (!isNaN(id)) setSession(id)
  }
}

export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

async function hashPassword(password: string): Promise<string> {
  const data = new TextEncoder().encode(password)
  const buf = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

function localUserToUser(u: ReturnType<typeof findUserById>): User {
  if (!u) throw new ApiError(401, 'Not authenticated')
  return { id: u.id, username: u.username, is_admin: u.isAdmin, created_at: u.createdAt }
}

function currentUser(): ReturnType<typeof findUserById> {
  const token = getToken()
  if (!token) throw new ApiError(401, 'Not authenticated')
  const id = parseInt(token.replace(SESSION_TOKEN_PREFIX, ''), 10)
  const user = findUserById(id)
  if (!user) throw new ApiError(401, 'Not authenticated')
  return user
}

export const api = {
  register: async (username: string, password: string): Promise<TokenResponse> => {
    if (findUserByUsername(username)) {
      throw new ApiError(400, 'Username already taken')
    }
    const hash = await hashPassword(password)
    const isAdmin = getUsers().length === 0 // first user is admin
    const user = createUser(username, hash, isAdmin)
    setSession(user.id)
    const token = `${SESSION_TOKEN_PREFIX}${user.id}`
    return { access_token: token, token_type: 'bearer', user: localUserToUser(user) }
  },

  login: async (username: string, password: string): Promise<TokenResponse> => {
    const user = findUserByUsername(username)
    if (!user) throw new ApiError(401, 'Invalid credentials')
    const hash = await hashPassword(password)
    if (hash !== user.passwordHash) throw new ApiError(401, 'Invalid credentials')
    setSession(user.id)
    const token = `${SESSION_TOKEN_PREFIX}${user.id}`
    return { access_token: token, token_type: 'bearer', user: localUserToUser(user) }
  },

  me: async (): Promise<User> => {
    return localUserToUser(currentUser())
  },

  listExercises: async (): Promise<ExerciseListItem[]> => {
    const user = currentUser()!
    catchUpLevel(user.id)
    const progress = getProgress(user.id)
    const attempts = getAttempts(user.id)
    const passedIds = new Set(attempts.filter((a) => a.passed).map((a) => a.exerciseId))

    return allExercises().map((e) => ({
      id: e.id,
      title: e.title,
      description: e.description,
      level: e.level,
      concept: e.concept,
      learn_section: e.learn_section,
      time_sig_top: e.time_sig_top,
      time_sig_bottom: e.time_sig_bottom,
      num_measures: e.num_measures,
      locked: e.level > progress.unlockedLevel,
      passed: passedIds.has(e.id),
      attempt_count: attempts.filter((a) => a.exerciseId === e.id).length,
    }))
  },

  getExercise: async (id: number): Promise<Exercise> => {
    currentUser() // assert logged in
    const exercise = allExercises().find((e) => e.id === id)
    if (!exercise) throw new ApiError(404, 'Exercise not found')
    return exercise
  },

  submitAttempt: async (
    exerciseId: number,
    tapsMs: number[],
    gaveUp: boolean,
    mode: AttemptMode = 'free',
  ): Promise<AttemptResult> => {
    const user = currentUser()!
    const exercise = allExercises().find((e) => e.id === exerciseId)
    if (!exercise) throw new ApiError(404, 'Exercise not found')

    const onsets = expectedOnsets(exercise.pattern)
    const expectedBeats = onsets.map((o) => o.beat)

    let scoreResult
    if (mode === 'strict') {
      const msPerBeat = 60000 / exercise.tempo_bpm
      scoreResult = scoreTapsStrict(expectedBeats, tapsMs, msPerBeat)
    } else {
      scoreResult = scoreTapsFree(expectedBeats, tapsMs)
    }

    const passed = !gaveUp && scoreResult.passed
    const { attemptId, outcome } = recordAttempt(
      user.id,
      exercise,
      tapsMs,
      gaveUp,
      mode,
      scoreResult.accuracy,
      passed,
    )

    const progress = getProgress(user.id)
    return {
      attempt_id: attemptId,
      passed,
      gave_up: gaveUp,
      mode,
      accuracy: scoreResult.accuracy,
      note_results: scoreResult.noteResults,
      inferred_bpm: scoreResult.inferredMsPerBeat ? Math.round(60000 / scoreResult.inferredMsPerBeat) : null,
      unlocked_level: progress.unlockedLevel,
      newly_unlocked_level: outcome.newlyUnlockedLevel,
      remediation_started: outcome.remediationStarted,
      remediation_active: outcome.remediationActive,
      message: outcome.message,
    }
  },

  getProgress: async (): Promise<ProgressSummary> => {
    const user = currentUser()!
    catchUpLevel(user.id)
    const progress = getProgress(user.id)
    const attempts = getAttempts(user.id)
    const mastery = getMastery(user.id)
    const remediation = getRemediation(user.id)
    const exercises = allExercises()
    const passedIds = new Set(attempts.filter((a) => a.passed).map((a) => a.exerciseId))

    const allConcepts = [...new Set(exercises.map((e) => e.concept))]
    const concepts = allConcepts.map((concept) => {
      const cm = mastery[concept] ?? { passes: 0, fails: 0 }
      return {
        concept,
        passes: cm.passes,
        fails: cm.fails,
        mastered: cm.passes >= 2,
      }
    })

    return {
      unlocked_level: progress.unlockedLevel,
      max_level: maxLevel(),
      total_attempts: attempts.length,
      total_passed_exercises: passedIds.size,
      total_exercises: exercises.length,
      concepts,
      remediation_active: remediation?.active ?? false,
      remediation_concept: remediation?.active ? remediation.concept : null,
    }
  },

  getNextExercise: async (): Promise<NextExercise> => {
    const user = currentUser()!
    const { exercise, reason, message } = nextExercise(user.id)
    return {
      exercise_id: exercise?.id ?? null,
      title: exercise?.title ?? null,
      level: exercise?.level ?? null,
      reason,
      message,
    }
  },

  admin: {
    listUsers: async (): Promise<AdminUser[]> => {
      const user = currentUser()!
      if (!user.isAdmin) throw new ApiError(403, 'Admin only')
      return getUsers().map((u) => {
        const attempts = getAttempts(u.id)
        const progress = getProgress(u.id)
        const passedIds = new Set(attempts.filter((a) => a.passed).map((a) => a.exerciseId))
        return {
          id: u.id,
          username: u.username,
          is_admin: u.isAdmin,
          created_at: u.createdAt,
          unlocked_level: progress.unlockedLevel,
          total_attempts: attempts.length,
          passed_exercises: passedIds.size,
        }
      })
    },

    getUser: async (id: number): Promise<AdminUserDetail> => {
      const admin = currentUser()!
      if (!admin.isAdmin) throw new ApiError(403, 'Admin only')
      const u = findUserById(id)
      if (!u) throw new ApiError(404, 'User not found')
      const attempts = getAttempts(u.id)
      const progress = getProgress(u.id)
      const mastery = getMastery(u.id)
      const passedIds = new Set(attempts.filter((a) => a.passed).map((a) => a.exerciseId))
      const exercises = allExercises()
      const allConcepts = [...new Set(exercises.map((e) => e.concept))]

      return {
        id: u.id,
        username: u.username,
        is_admin: u.isAdmin,
        created_at: u.createdAt,
        unlocked_level: progress.unlockedLevel,
        total_attempts: attempts.length,
        passed_exercises: passedIds.size,
        concepts: allConcepts.map((concept) => {
          const cm = mastery[concept] ?? { passes: 0, fails: 0 }
          return { concept, passes: cm.passes, fails: cm.fails, mastered: cm.passes >= 2 }
        }),
        recent_attempts: attempts
          .slice(-20)
          .reverse()
          .map((a) => {
            const ex = exercises.find((e) => e.id === a.exerciseId)
            return {
              id: a.id,
              exercise_id: a.exerciseId,
              exercise_title: ex?.title ?? `Exercise ${a.exerciseId}`,
              accuracy: a.accuracy,
              passed: a.passed,
              gave_up: a.gaveUp,
              mode: a.mode,
              created_at: a.createdAt,
            }
          }),
      }
    },

    listExercises: async (): Promise<Exercise[]> => {
      const user = currentUser()!
      if (!user.isAdmin) throw new ApiError(403, 'Admin only')
      return allExercises()
    },

    createExercise: async (payload: ExercisePayload): Promise<Exercise> => {
      const user = currentUser()!
      if (!user.isAdmin) throw new ApiError(403, 'Admin only')
      return createCustomExercise({ ...payload, is_active: payload.is_active ?? true })
    },

    updateExercise: async (id: number, payload: ExercisePayload): Promise<Exercise> => {
      const user = currentUser()!
      if (!user.isAdmin) throw new ApiError(403, 'Admin only')
      const updated = updateCustomExercise(id, { ...payload, is_active: payload.is_active ?? true })
      if (!updated) throw new ApiError(404, 'Exercise not found or cannot edit seed exercises')
      return updated
    },

    deleteExercise: async (id: number): Promise<void> => {
      const user = currentUser()!
      if (!user.isAdmin) throw new ApiError(403, 'Admin only')
      deleteCustomExercise(id)
    },

    // Test runner is backend-only; return a no-op stub so the UI doesn't crash
    runTests: async (_suite: 'backend' | 'frontend'): Promise<TestRunStatus> => ({
      suite: null,
      status: 'error',
      started_at: null,
      finished_at: null,
      summary: null,
      cases: [],
      error: 'Test runner is not available in the local-storage build.',
      raw_output: null,
    }),

    testStatus: async (): Promise<TestRunStatus> => ({
      suite: null,
      status: 'idle',
      started_at: null,
      finished_at: null,
      summary: null,
      cases: [],
      error: null,
      raw_output: null,
    }),
  },
}
