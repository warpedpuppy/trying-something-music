import { useState } from 'react'
import {
  DEFAULT_CONFIG,
  savePlayAlongConfig,
  type PlayAlongConfig,
} from '../../lib/playAlongConfig'
import type { DifficultyMode } from '../../lib/rhythmGenerator'

export function WelcomeScreen({
  onStart,
  cfg,
  onCfgChange,
}: {
  onStart: (bpm: number, mode: DifficultyMode) => void
  cfg: PlayAlongConfig
  onCfgChange: (cfg: PlayAlongConfig) => void
}) {
  const [localCfg, setLocalCfg] = useState<PlayAlongConfig>(() => ({ ...cfg }))
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [selectedMode, setSelectedMode] = useState<DifficultyMode>('easy')

  const BPM_MIN = 40
  const BPM_MAX = localCfg.bpmCap

  const speedLabel =
    localCfg.startBpm < 66  ? 'Slow' :
    localCfg.startBpm < 108 ? 'Moderate' :
    localCfg.startBpm < 168 ? 'Fast' :
    'Very fast'

  function update(patch: Partial<PlayAlongConfig>) {
    setLocalCfg(prev => {
      const next = { ...prev, ...patch }
      savePlayAlongConfig(next)
      onCfgChange(next)
      return next
    })
  }

  function resetDefaults() {
    const fresh = { ...DEFAULT_CONFIG }
    setLocalCfg(fresh)
    savePlayAlongConfig(fresh)
    onCfgChange(fresh)
  }

  const MODE_DESCRIPTIONS: Record<DifficultyMode, string> = {
    easy:         'One new concept every 8 measures — perfect for beginners',
    intermediate: 'One new concept every 4 measures — steady progression',
    advanced:     'One new concept every 2 measures — fast progression',
  }

  return (
    <div className="pa-stage pa-welcome">
      <h1 className="pa-welcome-title">Rhythm Game!</h1>
      <ul className="pa-welcome-bullets">
        <li>Sheet music scrolls by — tap the button in time with each note</li>
        <li>Hits turn green, misses turn orange — {localCfg.consecutiveMissesReset} consecutive misses ends the game</li>
        <li>The orange ▼ marks each downbeat and pulses to keep your place</li>
        <li>
          Every {localCfg.bpmIncreaseAfterMeasures} perfect measures, tempo rises by {localCfg.bpmIncreaseAmount} BPM, up to {localCfg.bpmCap}
        </li>
        <li><strong>Tap any measure while playing to pause and hear it played correctly</strong></li>
      </ul>

      {/* Difficulty mode picker */}
      <div className="pa-mode-section">
        <p className="pa-mode-heading">Difficulty</p>
        <div className="pa-mode-picker">
          {(['easy', 'intermediate', 'advanced'] as DifficultyMode[]).map(m => (
            <button
              key={m}
              type="button"
              className={`pa-mode-btn${selectedMode === m ? ' active' : ''}`}
              onClick={() => setSelectedMode(m)}
            >
              {m.charAt(0).toUpperCase() + m.slice(1)}
            </button>
          ))}
        </div>
        <p className="pa-mode-desc">{MODE_DESCRIPTIONS[selectedMode]}</p>
      </div>

      <p className="pa-tempo-row">
        Starting tempo:{' '}
        <span className="pa-tempo-inline-bpm">{localCfg.startBpm}</span>
        {' '}BPM
        <span className="pa-tempo-inline-label"> · <em>{speedLabel}</em></span>
      </p>
      <input
        type="range"
        className="pa-bpm-slider"
        min={BPM_MIN}
        max={BPM_MAX}
        step={1}
        value={localCfg.startBpm}
        onChange={e => update({ startBpm: Number(e.target.value) })}
        aria-label="Starting BPM"
      />
      <div className="pa-slider-labels">
        <span>{BPM_MIN}</span>
        <span>{BPM_MAX}</span>
      </div>

      <button type="button" className="btn-primary pa-cta" onClick={() => onStart(localCfg.startBpm, selectedMode)}>
        Let's go
      </button>

      {/* Settings accordion */}
      <button
        type="button"
        className="pa-settings-toggle"
        onClick={() => setSettingsOpen(o => !o)}
        aria-expanded={settingsOpen}
      >
        <span className={`pa-settings-caret${settingsOpen ? ' open' : ''}`}>›</span>
        {' '}Settings
      </button>

      {settingsOpen && (
        <div className="pa-settings-panel">

          <section className="pa-settings-section">
            <h3 className="pa-settings-heading">Tempo</h3>
            <label className="pa-settings-row">
              <span>BPM ceiling</span>
              <input type="number" min={localCfg.startBpm} max={400} step={1}
                value={localCfg.bpmCap}
                onChange={e => update({ bpmCap: Number(e.target.value) })}
              />
            </label>
            <label className="pa-settings-row">
              <span>Quantity of perfect measures between tempo increases</span>
              <input type="number" min={1} max={500} step={1}
                value={localCfg.bpmIncreaseAfterMeasures}
                onChange={e => update({ bpmIncreaseAfterMeasures: Number(e.target.value) })}
              />
            </label>
            <label className="pa-settings-row">
              <span>BPM increase per step</span>
              <input type="number" min={1} max={20} step={1}
                value={localCfg.bpmIncreaseAmount}
                onChange={e => update({ bpmIncreaseAmount: Number(e.target.value) })}
              />
            </label>
          </section>

          <section className="pa-settings-section">
            <h3 className="pa-settings-heading">Difficulty</h3>
            <label className="pa-settings-row">
              <span>Consecutive misses before reset</span>
              <input type="number" min={1} max={50} step={1}
                value={localCfg.consecutiveMissesReset}
                onChange={e => update({ consecutiveMissesReset: Number(e.target.value) })}
              />
            </label>
          </section>

          <div className="pa-settings-footer">
            <button type="button" className="pa-settings-reset" onClick={resetDefaults}>
              Reset to defaults
            </button>
          </div>

        </div>
      )}
    </div>
  )
}
