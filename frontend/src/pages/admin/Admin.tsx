import { useState } from 'react'
import { ExerciseManager } from './ExerciseManager'
import { TestRunner } from './TestRunner'
import { UsersTable } from './UsersTable'
import { PlayAlongSettings } from './PlayAlongSettings'

type Tab = 'users' | 'exercises' | 'play-along' | 'tests'

const TABS: Array<{ id: Tab; label: string }> = [
  { id: 'users', label: 'Users' },
  { id: 'exercises', label: 'Exercises' },
  { id: 'play-along', label: 'Play Along' },
  { id: 'tests', label: 'Tests' },
]

export function Admin() {
  const [tab, setTab] = useState<Tab>('users')
  return (
    <div>
      <h1>Admin</h1>
      <div className="admin-tabs" role="tablist">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={tab === item.id}
            className={tab === item.id ? 'active' : ''}
            onClick={() => setTab(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>
      {tab === 'users'      && <UsersTable />}
      {tab === 'exercises'  && <ExerciseManager />}
      {tab === 'play-along' && <PlayAlongSettings />}
      {tab === 'tests'      && <TestRunner />}
    </div>
  )
}
