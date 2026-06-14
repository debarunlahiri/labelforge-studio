import { query, queryOne, run } from '../dbHelpers'

export interface SystemSetting {
  key: string
  value: string
  updated_at: string | null
}

const DEFAULT_SETTINGS: Record<string, string> = {
  auto_save_enabled: 'true',
  auto_save_interval_seconds: '30',
}

export function getSystemSettings(): Record<string, string> {
  for (const [key, value] of Object.entries(DEFAULT_SETTINGS)) {
    run(
      'INSERT OR IGNORE INTO system_settings (key, value) VALUES (?, ?)',
      [key, value]
    )
  }

  const rows = query('SELECT key, value FROM system_settings') as SystemSetting[]
  return rows.reduce<Record<string, string>>((settings, row) => {
    settings[row.key] = row.value
    return settings
  }, {})
}

export function getSystemSetting(key: string): string | null {
  const settings = getSystemSettings()
  return settings[key] ?? null
}

export function setSystemSetting(key: string, value: string): SystemSetting {
  run(
    "INSERT INTO system_settings (key, value, updated_at) VALUES (?, ?, datetime('now')) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = datetime('now')",
    [key, value]
  )
  return queryOne('SELECT * FROM system_settings WHERE key = ?', [key]) as SystemSetting
}

export function setSystemSettings(settings: Record<string, string>): Record<string, string> {
  for (const [key, value] of Object.entries(settings)) {
    setSystemSetting(key, value)
  }
  return getSystemSettings()
}
