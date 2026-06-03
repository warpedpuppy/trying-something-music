/**
 * Typed localStorage helpers for the local-storage-only build.
 * All data lives under the 'rhythm:' key namespace.
 */

export interface LocalUser {
  id: number
  username: string
  passwordHash: string
  isAdmin: boolean
  createdAt: string
}

export interface LocalProgress {
  unlockedLevel: number
}

export interface LocalAttempt {
  id: number
  exerciseId: number
  tapsMs: number[]
  passed: boolean
  gaveUp: boolean
  mode: 'free' | 'strict'
  accuracy: number
  createdAt: string
}

export interface LocalMastery {
  [concept: string]: { passes: number; fails: number }
}

export interface LocalRemediation {
  id: number
  sourceExerciseId: number
  concept: string
  completedPasses: number
  active: boolean
}

export interface LocalCustomExercise {
  id: number
  title: string
  description: string
  level: number
  concept: string
  learn_section: string
  time_sig_top: number
  time_sig_bottom: number
  num_measures: number
  tempo_bpm: number
  pattern: { events: unknown[] }
  is_active: boolean
}

export interface PlayAlongBest {
  maxCleanMeasures: number
  updatedAt: string
}

const K = {
  users: 'rhythm:users',
  session: 'rhythm:session',
  progress: (uid: number) => `rhythm:progress:${uid}`,
  attempts: (uid: number) => `rhythm:attempts:${uid}`,
  mastery: (uid: number) => `rhythm:mastery:${uid}`,
  remediation: (uid: number) => `rhythm:remediation:${uid}`,
  customExercises: 'rhythm:custom-exercises',
  nextId: (ns: string) => `rhythm:nextid:${ns}`,
  playAlongBest: (uid: number) => `rhythm:playalong-best:${uid}`,
  theoryVisits: (uid: number) => `rhythm:theory-visits:${uid}`,
}

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw === null ? fallback : (JSON.parse(raw) as T)
  } catch {
    return fallback
  }
}

function save(key: string, value: unknown): void {
  localStorage.setItem(key, JSON.stringify(value))
}

function nextId(ns: string): number {
  const id = load<number>(K.nextId(ns), 1)
  save(K.nextId(ns), id + 1)
  return id
}

// Users
export function getUsers(): LocalUser[] {
  return load<LocalUser[]>(K.users, [])
}

export function saveUsers(users: LocalUser[]): void {
  save(K.users, users)
}

export function createUser(username: string, passwordHash: string, isAdmin: boolean): LocalUser {
  const users = getUsers()
  const user: LocalUser = {
    id: nextId('users'),
    username,
    passwordHash,
    isAdmin,
    createdAt: new Date().toISOString(),
  }
  users.push(user)
  saveUsers(users)
  return user
}

export function findUserByUsername(username: string): LocalUser | null {
  return getUsers().find((u) => u.username === username) ?? null
}

export function findUserById(id: number): LocalUser | null {
  return getUsers().find((u) => u.id === id) ?? null
}

// Session
export function getSession(): { userId: number } | null {
  return load<{ userId: number } | null>(K.session, null)
}

export function setSession(userId: number | null): void {
  if (userId === null) {
    localStorage.removeItem(K.session)
  } else {
    save(K.session, { userId })
  }
}

// Progress
export function getProgress(userId: number): LocalProgress {
  return load<LocalProgress>(K.progress(userId), { unlockedLevel: 1 })
}

export function saveProgress(userId: number, progress: LocalProgress): void {
  save(K.progress(userId), progress)
}

// Attempts
export function getAttempts(userId: number): LocalAttempt[] {
  return load<LocalAttempt[]>(K.attempts(userId), [])
}

export function addAttempt(userId: number, attempt: Omit<LocalAttempt, 'id' | 'createdAt'>): LocalAttempt {
  const attempts = getAttempts(userId)
  const full: LocalAttempt = {
    ...attempt,
    id: nextId('attempts'),
    createdAt: new Date().toISOString(),
  }
  attempts.push(full)
  save(K.attempts(userId), attempts)
  return full
}

// Mastery
export function getMastery(userId: number): LocalMastery {
  return load<LocalMastery>(K.mastery(userId), {})
}

export function saveMastery(userId: number, mastery: LocalMastery): void {
  save(K.mastery(userId), mastery)
}

// Remediation
export function getRemediation(userId: number): LocalRemediation | null {
  return load<LocalRemediation | null>(K.remediation(userId), null)
}

export function saveRemediation(userId: number, rem: LocalRemediation | null): void {
  if (rem === null) {
    localStorage.removeItem(K.remediation(userId))
  } else {
    save(K.remediation(userId), rem)
  }
}

// Custom exercises (admin-created)
export function getCustomExercises(): LocalCustomExercise[] {
  return load<LocalCustomExercise[]>(K.customExercises, [])
}

export function saveCustomExercises(exercises: LocalCustomExercise[]): void {
  save(K.customExercises, exercises)
}

export function nextExerciseId(): number {
  return nextId('exercises')
}

// Play Along best streak
export function getPlayAlongBest(userId: number): PlayAlongBest {
  return load<PlayAlongBest>(K.playAlongBest(userId), { maxCleanMeasures: 0, updatedAt: '' })
}

export function updatePlayAlongBest(userId: number, cleanMeasures: number): void {
  const current = getPlayAlongBest(userId)
  if (cleanMeasures > current.maxCleanMeasures) {
    save(K.playAlongBest(userId), {
      maxCleanMeasures: cleanMeasures,
      updatedAt: new Date().toISOString(),
    })
  }
}

// Theory page visits — tracked by slug (e.g. 'notes', 'intervals')
export function getTheoryVisits(userId: number): string[] {
  return load<string[]>(K.theoryVisits(userId), [])
}

export function recordTheoryVisit(userId: number, slug: string): void {
  const visits = getTheoryVisits(userId)
  if (!visits.includes(slug)) {
    visits.push(slug)
    save(K.theoryVisits(userId), visits)
  }
}
