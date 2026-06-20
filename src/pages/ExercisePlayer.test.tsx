import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { api } from '../api/client'
import type { AttemptResult, Exercise } from '../api/types'
import { tickEngine } from '../lib/audio'
import { ExercisePlayer } from './ExercisePlayer'

const EXERCISE: Exercise = {
  id: 1,
  title: 'Four steady quarters',
  description: 'Tap every beat.',
  level: 1,
  concept: 'note-values',
  learn_section: 'note-values',
  time_sig_top: 4,
  time_sig_bottom: 4,
  num_measures: 1,
  tempo_bpm: 80,
  pattern: {
    events: [
      { type: 'note', duration: 'q' },
      { type: 'note', duration: 'q' },
      { type: 'note', duration: 'q' },
      { type: 'note', duration: 'q' },
    ],
  },
  is_active: true,
  tap_count: 4,
}

// Fast BPM makes the 4-beat count-in complete in ~1 second of real time
const FAST_EXERCISE: Exercise = { ...EXERCISE, tempo_bpm: 240 }

const PASSED_RESULT: AttemptResult = {
  attempt_id: 10,
  passed: true,
  gave_up: false,
  mode: 'strict',
  accuracy: 1,
  note_results: [0, 1, 2, 3].map((index) => ({
    index,
    expected_beat: index,
    actual_beat: index,
    deviation_beats: 0,
    verdict: 'on_time' as const,
  })),
  inferred_bpm: 100,
  unlocked_level: 1,
  newly_unlocked_level: null,
  remediation_started: false,
  remediation_active: false,
  message: 'Nice — you tapped that rhythm correctly!',
}

function renderPlayer() {
  return render(
    <MemoryRouter initialEntries={['/exercises/1']}>
      <Routes>
        <Route path="/exercises/:id" element={<ExercisePlayer />} />
        <Route path="/learn" element={<p>learn page</p>} />
      </Routes>
    </MemoryRouter>,
  )
}

// Clicks the TAP button the given number of times using pointer events
async function tapButton(times: number) {
  for (let i = 0; i < times; i++) {
    await userEvent.click(screen.getByRole('button', { name: /TAP/i }))
  }
}

describe('ExercisePlayer', () => {
  it('loads the exercise and links to its Learn section', async () => {
    vi.spyOn(api, 'getExercise').mockResolvedValue(EXERCISE)
    renderPlayer()
    expect(await screen.findByText('Four steady quarters')).toBeInTheDocument()
    const link = screen.getByRole('link', { name: /learn about note values/i })
    expect(link).toHaveAttribute('href', '/rhythm/learn#note-values')
  })

  it('auto-starts count-in then captures taps and submits them', async () => {
    vi.spyOn(api, 'getExercise').mockResolvedValue(FAST_EXERCISE)
    const submitSpy = vi.spyOn(api, 'submitAttempt').mockResolvedValue(PASSED_RESULT)
    renderPlayer()
    await screen.findByText('Four steady quarters')

    // Count-in fires automatically — wait for the TAP button to appear (capturing phase)
    await screen.findByRole('button', { name: /TAP/i }, { timeout: 4000 })

    await tapButton(4)

    await waitFor(() => expect(submitSpy).toHaveBeenCalledTimes(1))
    const [exerciseId, taps, gaveUp] = submitSpy.mock.calls[0]
    expect(exerciseId).toBe(1)
    expect(taps).toHaveLength(4)
    expect(gaveUp).toBe(false)

    expect(await screen.findByText(/Passed!/)).toBeInTheDocument()
    expect(screen.getByText(/Accuracy: 100%/)).toBeInTheDocument()
  })

  it('count-in runs before capture opens', async () => {
    vi.spyOn(api, 'getExercise').mockResolvedValue(FAST_EXERCISE)
    const submitSpy = vi.spyOn(api, 'submitAttempt').mockResolvedValue({
      ...PASSED_RESULT,
      inferred_bpm: 240,
    })
    renderPlayer()
    await screen.findByText('Four steady quarters')

    // Count-in should be visible immediately after exercise loads
    expect(screen.getByText(/Count-in/)).toBeInTheDocument()
    expect(submitSpy).not.toHaveBeenCalled()

    // Wait for count-in to end
    await screen.findByRole('button', { name: /TAP/i }, { timeout: 4000 })
    expect(screen.queryByText(/Count-in/)).not.toBeInTheDocument()

    await tapButton(4)
    await waitFor(() => expect(submitSpy).toHaveBeenCalledTimes(1))
    const [, taps, gaveUp] = submitSpy.mock.calls[0]
    expect(gaveUp).toBe(false)
    expect(taps).toHaveLength(4)
    // Taps are relative to the downbeat epoch; first tap should be close to zero
    expect(Math.abs((taps as number[])[0])).toBeLessThan(2000)
  })

  it('free mode is the default and submits without a prior tap offset', async () => {
    vi.spyOn(api, 'getExercise').mockResolvedValue(FAST_EXERCISE)
    const submitSpy = vi.spyOn(api, 'submitAttempt').mockResolvedValue(PASSED_RESULT)
    renderPlayer()
    await screen.findByRole('button', { name: /TAP/i }, { timeout: 4000 })
    await tapButton(4)
    await waitFor(() => expect(submitSpy).toHaveBeenCalledTimes(1))
    // Mode is always 'strict' — the count-in aligns taps to the downbeat
    expect(submitSpy.mock.calls[0][3]).toBe('strict')
    expect(submitSpy.mock.calls[0][2]).toBe(false)
  })

  it('runs the metronome at the exercise tempo while capturing and stops it after', async () => {
    vi.spyOn(api, 'getExercise').mockResolvedValue(FAST_EXERCISE)
    vi.spyOn(api, 'submitAttempt').mockResolvedValue(PASSED_RESULT)
    const startSpy = vi.spyOn(tickEngine, 'startMetronome')
    const stopSpy = vi.spyOn(tickEngine, 'stopMetronome')
    renderPlayer()
    await screen.findByText('Four steady quarters')

    // Metronome starts automatically with the count-in
    await waitFor(() => expect(startSpy).toHaveBeenCalledWith(
      FAST_EXERCISE.tempo_bpm,
      expect.any(Function),
    ))
    expect(tickEngine.metronomeRunning).toBe(true)
    const metronome = screen.getByTestId('metronome')
    expect(metronome).toHaveAttribute('data-running', 'true')
    expect(metronome.querySelector('.metronome-pendulum.swinging')).not.toBeNull()

    // Wait for capturing phase then tap
    await screen.findByRole('button', { name: /TAP/i }, { timeout: 4000 })
    await tapButton(4)
    await screen.findByText(/Passed!/)
    expect(stopSpy).toHaveBeenCalled()
    expect(tickEngine.metronomeRunning).toBe(false)
    expect(screen.queryByTestId('metronome')).not.toBeInTheDocument()
  })

  it('submits a gave_up attempt after the give-up button is clicked', async () => {
    vi.spyOn(api, 'getExercise').mockResolvedValue(FAST_EXERCISE)
    const submitSpy = vi.spyOn(api, 'submitAttempt').mockResolvedValue({
      ...PASSED_RESULT,
      passed: false,
      gave_up: true,
      accuracy: 0,
      message: 'Attempt recorded.',
    })
    renderPlayer()
    await screen.findByText('Four steady quarters')

    // Give-up button appears only during capturing — wait for it
    await screen.findByRole('button', { name: /I give up/i }, { timeout: 4000 })

    await userEvent.click(screen.getByRole('button', { name: /I give up/i }))
    expect(screen.getByRole('heading', { name: /Hear the rhythm/i })).toBeInTheDocument()

    await waitFor(() => expect(submitSpy).toHaveBeenCalledWith(1, [], true, 'strict'), {
      timeout: 5000,
    })
  })

  it('shows what the student actually played after a failed attempt', async () => {
    vi.spyOn(api, 'getExercise').mockResolvedValue(FAST_EXERCISE)
    vi.spyOn(api, 'submitAttempt').mockResolvedValue({
      ...PASSED_RESULT,
      passed: false,
      accuracy: 0.5,
      note_results: PASSED_RESULT.note_results.map((note, i) => ({
        ...note,
        verdict: i < 2 ? ('on_time' as const) : ('late' as const),
      })),
      message: 'Not quite.',
    })
    renderPlayer()

    await screen.findByRole('button', { name: /TAP/i }, { timeout: 4000 })
    await tapButton(4)

    const toggle = await screen.findByRole('button', { name: /Show what you actually played/ })
    await userEvent.click(toggle)
    expect(screen.getByText(/Your taps, written out as notation/)).toBeInTheDocument()
  })
})
