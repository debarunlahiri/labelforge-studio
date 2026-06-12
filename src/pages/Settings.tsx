import { useEffect, useState } from 'react'
import { useAuthStore } from '../store/authStore'

export default function Settings() {
  const { user } = useAuthStore()
  const [activeTab, setActiveTab] = useState('general')
  const [generalSettings, setGeneralSettings] = useState({
    companyName: '',
    plantCode: '',
    defaultDpi: '300',
    defaultUnit: 'mm',
    autoSave: true,
    autoSaveInterval: '30',
  })

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      const vars = await window.electronAPI?.globalVariables.list() || []
      const companyVar = vars.find((v: any) => v.variable_key === 'company_name')
      const plantVar = vars.find((v: any) => v.variable_key === 'plant_code')
      setGeneralSettings({
        ...generalSettings,
        companyName: companyVar?.variable_value || '',
        plantCode: plantVar?.variable_value || '',
      })
    } catch {}
  }

  const tabs = [
    { id: 'general', label: 'General' },
    { id: 'database', label: 'Database' },
    { id: 'printing', label: 'Printing' },
    { id: 'security', label: 'Security' },
  ]

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Settings</h1>

      <div className="flex gap-6">
        <div className="w-48">
          <nav className="space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'bg-[var(--color-primary)] text-white'
                    : 'hover:bg-slate-100 text-[var(--text-secondary)]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="flex-1">
          {activeTab === 'general' && (
            <div className="rounded-xl border border-[var(--border-color)] bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold">General Settings</h2>
              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium">Company Name</label>
                  <input
                    type="text"
                    value={generalSettings.companyName}
                    onChange={(e) => setGeneralSettings({ ...generalSettings, companyName: e.target.value })}
                    className="w-full max-w-md rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Plant Code</label>
                  <input
                    type="text"
                    value={generalSettings.plantCode}
                    onChange={(e) => setGeneralSettings({ ...generalSettings, plantCode: e.target.value })}
                    className="w-full max-w-md rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Default DPI</label>
                  <select
                    value={generalSettings.defaultDpi}
                    onChange={(e) => setGeneralSettings({ ...generalSettings, defaultDpi: e.target.value })}
                    className="w-full max-w-md rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  >
                    <option value="203">203 DPI</option>
                    <option value="300">300 DPI</option>
                    <option value="600">600 DPI</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Default Unit</label>
                  <select
                    value={generalSettings.defaultUnit}
                    onChange={(e) => setGeneralSettings({ ...generalSettings, defaultUnit: e.target.value })}
                    className="w-full max-w-md rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  >
                    <option value="mm">Millimeter</option>
                    <option value="cm">Centimeter</option>
                    <option value="in">Inch</option>
                    <option value="px">Pixel</option>
                  </select>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={generalSettings.autoSave}
                    onChange={(e) => setGeneralSettings({ ...generalSettings, autoSave: e.target.checked })}
                    className="h-4 w-4"
                  />
                  <label className="text-sm font-medium">Enable Auto-save</label>
                </div>
                {generalSettings.autoSave && (
                  <div>
                    <label className="mb-1 block text-sm font-medium">Auto-save Interval (seconds)</label>
                    <input
                      type="number"
                      value={generalSettings.autoSaveInterval}
                      onChange={(e) => setGeneralSettings({ ...generalSettings, autoSaveInterval: e.target.value })}
                      className="w-32 rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'database' && (
            <div className="rounded-xl border border-[var(--border-color)] bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold">Database Settings</h2>
              <div className="rounded-lg bg-green-50 border border-green-200 p-4">
                <p className="text-sm text-green-700">
                  <strong>SQLite</strong> - Local embedded database is active.
                </p>
                <p className="mt-1 text-xs text-green-600">
                  Database is stored within the application. No external database server is required.
                </p>
              </div>
              <div className="mt-4 space-y-3 text-sm text-[var(--text-secondary)]">
                <p>The database stores all your templates, print jobs, users, and settings locally within the application.</p>
                <p>Database location: <code className="rounded bg-slate-100 px-1 py-0.5 text-xs">~/Library/Application Support/labelforge-studio/labelforge.db</code></p>
              </div>
            </div>
          )}

          {activeTab === 'printing' && (
            <div className="rounded-xl border border-[var(--border-color)] bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold">Printing Settings</h2>
              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium">Default Print Method</label>
                  <select className="w-full max-w-md rounded-lg border border-slate-300 px-3 py-2 text-sm">
                    <option value="driver">Driver-based (PDF)</option>
                    <option value="zpl">Raw ZPL</option>
                    <option value="epl">Raw EPL</option>
                    <option value="tspl">Raw TSPL</option>
                  </select>
                </div>
                <div className="flex items-center gap-3">
                  <input type="checkbox" defaultChecked className="h-4 w-4" />
                  <label className="text-sm font-medium">Show preview before printing</label>
                </div>
                <div className="flex items-center gap-3">
                  <input type="checkbox" defaultChecked className="h-4 w-4" />
                  <label className="text-sm font-medium">Log all print jobs</label>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="rounded-xl border border-[var(--border-color)] bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold">Security Settings</h2>
              <div className="space-y-4">
                <div className="rounded-lg bg-slate-50 p-4 text-sm">
                  <p><strong>Current User:</strong> {user?.username || 'N/A'}</p>
                  <p><strong>Roles:</strong> {user?.roles?.join(', ') || 'N/A'}</p>
                  <p><strong>Permissions:</strong> {user?.permissions?.length || 0} granted</p>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Session Timeout (minutes)</label>
                  <input
                    type="number"
                    defaultValue={30}
                    className="w-32 rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
                <div className="flex items-center gap-3">
                  <input type="checkbox" defaultChecked className="h-4 w-4" />
                  <label className="text-sm font-medium">Require password for printing</label>
                </div>
                <div className="flex items-center gap-3">
                  <input type="checkbox" defaultChecked className="h-4 w-4" />
                  <label className="text-sm font-medium">Enable audit logging</label>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}