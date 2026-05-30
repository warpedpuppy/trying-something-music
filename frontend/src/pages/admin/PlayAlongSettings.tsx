import { useState } from 'react'
import {
  DEFAULT_CONFIG,
  loadPlayAlongConfig,
  savePlayAlongConfig,
  type PlayAlongConfig,
  type TimeSigUnlock,
} from '../../lib/playAlongConfig'

export function PlayAlongSettings() {
  const [cfg, setCfg] = useState<PlayAlongConfig>(loadPlayAlongConfig)
  const [saved, setSaved] = useState(false)

  function update(patch: Partial<PlayAlongConfig>) {
    setCfg(prev => ({ ...prev, ...patch }))
    setSaved(false)
  }

  function updateTimeSig(index: number, patch: Partial<TimeSigUnlock>) {
    setCfg(prev => {
      const timeSigs = prev.timeSigs.map((ts, i) => i === index ? { ...ts, ...patch } : ts)
      return { ...prev, timeSigs }
    })
    setSaved(false)
  }

  function addTimeSig() {
    setCfg(prev => ({
      ...prev,
      timeSigs: [...prev.timeSigs, { top: 5, bottom: 4, afterMeasures: 20 }],
    }))
    setSaved(false)
  }

  function removeTimeSig(index: number) {
    setCfg(prev => ({
      ...prev,
      timeSigs: prev.timeSigs.filter((_, i) => i !== index),
    }))
    setSaved(false)
  }

  function handleSave() {
    savePlayAlongConfig(cfg)
    setSaved(true)
  }

  function handleReset() {
    const fresh = { ...DEFAULT_CONFIG }
    setCfg(fresh)
    savePlayAlongConfig(fresh)
    setSaved(true)
  }

  return (
    <div className="pa-admin">
      <h2 className="pa-admin-heading">Play Along Settings</h2>
      <p className="pa-admin-hint">
        Changes take effect when the player navigates to Play Along (or refreshes the page).
      </p>

      <section className="pa-admin-section">
        <h3>Tempo</h3>

        <label className="pa-admin-row">
          <span>Starting BPM</span>
          <input
            type="number" min={40} max={80} step={1}
            value={cfg.startBpm}
            onChange={e => update({ startBpm: Number(e.target.value) })}
          />
        </label>

        <label className="pa-admin-row">
          <span>BPM ceiling (cap)</span>
          <input
            type="number" min={cfg.startBpm} max={400} step={1}
            value={cfg.bpmCap}
            onChange={e => update({ bpmCap: Number(e.target.value) })}
          />
        </label>

        <label className="pa-admin-row">
          <span>Increase BPM after every <em>N</em> successful measures</span>
          <input
            type="number" min={1} max={500} step={1}
            value={cfg.bpmIncreaseAfterMeasures}
            onChange={e => update({ bpmIncreaseAfterMeasures: Number(e.target.value) })}
          />
        </label>

        <label className="pa-admin-row">
          <span>BPM increase amount</span>
          <input
            type="number" min={1} max={20} step={1}
            value={cfg.bpmIncreaseAmount}
            onChange={e => update({ bpmIncreaseAmount: Number(e.target.value) })}
          />
        </label>
      </section>

      <section className="pa-admin-section">
        <h3>Difficulty</h3>

        <label className="pa-admin-row">
          <span>Consecutive misses before reset</span>
          <input
            type="number" min={1} max={50} step={1}
            value={cfg.consecutiveMissesReset}
            onChange={e => update({ consecutiveMissesReset: Number(e.target.value) })}
          />
        </label>
      </section>

      <section className="pa-admin-section">
        <h3>Time signatures</h3>
        <p className="pa-admin-hint">
          Each row is a time signature that can appear in the game.
          <strong> Unlock after</strong> is the number of successful measures
          before this time sig is introduced. Set it to 0 to allow it from the start.
        </p>

        <table className="pa-admin-table">
          <thead>
            <tr>
              <th>Top (numerator)</th>
              <th>Bottom (denominator)</th>
              <th>Unlock after (measures)</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {cfg.timeSigs.map((ts, i) => (
              <tr key={i}>
                <td>
                  <input
                    type="number" min={2} max={12} step={1}
                    value={ts.top}
                    onChange={e => updateTimeSig(i, { top: Number(e.target.value) })}
                  />
                </td>
                <td>
                  <input
                    type="number" min={2} max={16} step={1}
                    value={ts.bottom}
                    onChange={e => updateTimeSig(i, { bottom: Number(e.target.value) })}
                  />
                </td>
                <td>
                  <input
                    type="number" min={0} max={9999} step={1}
                    value={ts.afterMeasures}
                    onChange={e => updateTimeSig(i, { afterMeasures: Number(e.target.value) })}
                  />
                </td>
                <td>
                  <button
                    type="button"
                    className="pa-admin-remove"
                    onClick={() => removeTimeSig(i)}
                    aria-label={`Remove ${ts.top}/${ts.bottom}`}
                    disabled={cfg.timeSigs.length <= 1}
                  >
                    ✕
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <button type="button" className="pa-admin-add" onClick={addTimeSig}>
          + Add time signature
        </button>
      </section>

      <div className="pa-admin-actions">
        <button type="button" className="btn-primary" onClick={handleSave}>
          Save changes
        </button>
        <button type="button" className="btn-secondary" onClick={handleReset}>
          Reset to defaults
        </button>
        {saved && <span className="pa-admin-saved">✓ Saved</span>}
      </div>
    </div>
  )
}
