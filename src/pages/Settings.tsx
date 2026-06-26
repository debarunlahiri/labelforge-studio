import { useEffect, useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faBuilding,
  faDisplay,
  faDatabase,
  faFloppyDisk,
  faMousePointer,
  faPrint,
  faRulerCombined,
  faRocket,
} from '@fortawesome/free-solid-svg-icons'
import PageHero from '../components/PageHero'

export default function Settings() {
  const [generalSettings, setGeneralSettings] = useState({
    companyName: '',
    plantCode: '',
    defaultDpi: '300',
    defaultUnit: 'mm',
    autoSave: true,
    autoSaveInterval: '30',
    showGridByDefault: true,
    snapToGridByDefault: true,
    gridSize: '10',
    defaultZoom: '100',
    compactInterface: false,
    reduceMotion: false,
    highContrast: false,
    startPage: 'dashboard',
    reopenLastTemplate: false,
    confirmBeforeDelete: true,
    printMethod: 'driver',
    showPrintPreview: true,
    keepPrintHistory: true,
  })
  const [settingsStatus, setSettingsStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [appVersion, setAppVersion] = useState('1.0.0')

  useEffect(() => {
    loadSettings()
    window.electronAPI?.app.getVersion()
      .then((version: string) => setAppVersion(version))
      .catch(() => undefined)
  }, [])

  const loadSettings = async () => {
    try {
      const vars = await window.electronAPI?.globalVariables.list() || []
      const settings = await window.electronAPI?.settings.getAll() || {}
      const companyVar = vars.find((v: any) => v.variable_key === 'company_name')
      const plantVar = vars.find((v: any) => v.variable_key === 'plant_code')
      setGeneralSettings({
        ...generalSettings,
        companyName: companyVar?.variable_value || '',
        plantCode: plantVar?.variable_value || '',
        defaultDpi: settings.default_dpi || generalSettings.defaultDpi,
        defaultUnit: settings.default_unit || generalSettings.defaultUnit,
        autoSave: settings.auto_save_enabled !== 'false',
        autoSaveInterval: settings.auto_save_interval_seconds || generalSettings.autoSaveInterval,
        showGridByDefault: settings.designer_show_grid !== 'false',
        snapToGridByDefault: settings.designer_snap_to_grid !== 'false',
        gridSize: settings.designer_grid_size || '10',
        defaultZoom: settings.designer_default_zoom || '100',
        compactInterface: settings.interface_compact === 'true',
        reduceMotion: settings.interface_reduce_motion === 'true',
        highContrast: settings.interface_high_contrast === 'true',
        startPage: settings.start_page || 'dashboard',
        reopenLastTemplate: settings.reopen_last_template === 'true',
        confirmBeforeDelete: settings.confirm_before_delete !== 'false',
        printMethod: settings.print_method || 'driver',
        showPrintPreview: settings.show_print_preview !== 'false',
        keepPrintHistory: settings.keep_print_history !== 'false',
      })
    } catch {}
  }

  const persistSettings = async (updates: Record<string, string>) => {
    setSettingsStatus('saving')
    try {
      const result = await window.electronAPI?.settings.setMany(updates)
      setSettingsStatus(result?.success === false ? 'error' : 'saved')
      setTimeout(() => setSettingsStatus('idle'), 1800)
    } catch {
      setSettingsStatus('error')
    }
  }

  const updateGeneralSetting = (updates: Partial<typeof generalSettings>, persisted: Record<string, string>) => {
    setGeneralSettings((current) => ({ ...current, ...updates }))
    persistSettings(persisted)
  }

  const inputClass =
    'h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 transition-colors focus:border-blue-400 focus:ring-2 focus:ring-blue-100'

  const PreferenceToggle = ({
    checked,
    title,
    description,
    onChange,
  }: {
    checked: boolean
    title: string
    description: string
    onChange: (checked: boolean) => void
  }) => (
    <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4 transition-colors hover:border-slate-300">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-0.5 h-4 w-4"
      />
      <span>
        <span className="block text-sm font-semibold text-slate-800">{title}</span>
        <span className="mt-1 block text-xs leading-5 text-slate-600">{description}</span>
      </span>
    </label>
  )

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-10">
      <PageHero
        eyebrow="Application preferences"
        title="Settings"
        description="Choose how LabelForge creates, saves, and prints your labels."
        icon={faDisplay}
        actions={
        <span className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
          settingsStatus === 'error' ? 'bg-red-50 text-red-700' :
          settingsStatus === 'saved' ? 'bg-green-50 text-green-700' :
          settingsStatus === 'saving' ? 'bg-blue-50 text-blue-700' :
          'bg-slate-100 text-slate-500'
        }`}>
          {settingsStatus === 'saving' ? 'Saving changes…' : settingsStatus === 'saved' ? 'Changes saved' : settingsStatus === 'error' ? 'Could not save' : 'Changes save automatically'}
        </span>
        }
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-start gap-3 border-b border-slate-200 px-6 py-5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
              <FontAwesomeIcon icon={faBuilding} />
            </div>
            <div>
              <h2 className="font-semibold text-slate-900">Workspace identity</h2>
              <p className="mt-1 text-xs leading-5 text-slate-600">Information used to identify this installation and production location.</p>
            </div>
          </div>
          <div className="grid gap-5 p-6 sm:grid-cols-2">
            <div className="sm:col-span-2">
                  <label className="mb-2 block text-sm font-semibold text-slate-800">Organization name</label>
                  <input
                    type="text"
                    value={generalSettings.companyName}
                    onChange={(e) => setGeneralSettings({ ...generalSettings, companyName: e.target.value })}
                    className={inputClass}
                    placeholder="Your company or facility name"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-800">Location code</label>
                  <input
                    type="text"
                    value={generalSettings.plantCode}
                    onChange={(e) => setGeneralSettings({ ...generalSettings, plantCode: e.target.value })}
                    className={inputClass}
                    placeholder="Example: PL01"
                  />
                  <p className="mt-2 text-xs text-slate-500">A short identifier for this plant, warehouse, or workstation.</p>
                </div>
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-start gap-3 border-b border-slate-200 px-6 py-5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-violet-50 text-violet-700">
              <FontAwesomeIcon icon={faRulerCombined} />
            </div>
            <div>
              <h2 className="font-semibold text-slate-900">New label defaults</h2>
              <p className="mt-1 text-xs leading-5 text-slate-600">Starting values used whenever you create a new label.</p>
            </div>
          </div>
          <div className="grid gap-5 p-6 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-800">Print resolution</label>
                  <select
                    value={generalSettings.defaultDpi}
                    onChange={(e) => updateGeneralSetting({ defaultDpi: e.target.value }, { default_dpi: e.target.value })}
                    className={inputClass}
                  >
                    <option value="203">203 DPI</option>
                    <option value="300">300 DPI</option>
                    <option value="600">600 DPI</option>
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-800">Measurement unit</label>
                  <select
                    value={generalSettings.defaultUnit}
                    onChange={(e) => updateGeneralSetting({ defaultUnit: e.target.value }, { default_unit: e.target.value })}
                    className={inputClass}
                  >
                    <option value="mm">Millimeter</option>
                    <option value="cm">Centimeter</option>
                    <option value="in">Inch</option>
                    <option value="px">Pixel</option>
                  </select>
                </div>
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-start gap-3 border-b border-slate-200 px-6 py-5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
              <FontAwesomeIcon icon={faFloppyDisk} />
            </div>
            <div>
              <h2 className="font-semibold text-slate-900">Saving and recovery</h2>
              <p className="mt-1 text-xs leading-5 text-slate-600">Protect in-progress label changes from accidental loss.</p>
            </div>
          </div>
          <div className="space-y-5 p-6">
                <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <input
                    type="checkbox"
                    checked={generalSettings.autoSave}
                    onChange={(e) => updateGeneralSetting({ autoSave: e.target.checked }, { auto_save_enabled: String(e.target.checked) })}
                    className="mt-0.5 h-4 w-4"
                  />
                  <span>
                    <span className="block text-sm font-semibold text-slate-800">Automatically save designer changes</span>
                    <span className="mt-1 block text-xs leading-5 text-slate-600">Recommended for normal use. Your active template is saved periodically while you work.</span>
                  </span>
                </label>
                {generalSettings.autoSave && (
                  <div className="max-w-xs">
                    <label className="mb-2 block text-sm font-semibold text-slate-800">Save every</label>
                    <div className="flex items-center gap-3">
                    <input
                      type="number"
                      min={5}
                      max={600}
                      value={generalSettings.autoSaveInterval}
                      onChange={(e) => {
                        const value = String(Math.max(5, Math.min(600, Number(e.target.value) || 30)))
                        updateGeneralSetting({ autoSaveInterval: value }, { auto_save_interval_seconds: value })
                      }}
                      className={inputClass}
                    />
                    <span className="shrink-0 text-sm text-slate-600">seconds</span>
                    </div>
                    <p className="mt-2 text-xs text-slate-500">Choose a value between 5 and 600 seconds.</p>
                  </div>
                )}
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-start gap-3 border-b border-slate-200 px-6 py-5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-700">
              <FontAwesomeIcon icon={faPrint} />
            </div>
            <div>
              <h2 className="font-semibold text-slate-900">Printing experience</h2>
              <p className="mt-1 text-xs leading-5 text-slate-600">Control how jobs are prepared before they reach a printer.</p>
            </div>
          </div>
              <div className="space-y-5 p-6">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-800">Preferred print method</label>
                  <select
                    value={generalSettings.printMethod}
                    onChange={(event) => updateGeneralSetting(
                      { printMethod: event.target.value },
                      { print_method: event.target.value },
                    )}
                    className={inputClass}
                  >
                    <option value="driver">Driver-based (PDF)</option>
                    <option value="zpl">Raw ZPL</option>
                    <option value="epl">Raw EPL</option>
                    <option value="tspl">Raw TSPL</option>
                  </select>
                </div>
                <PreferenceToggle
                  checked={generalSettings.showPrintPreview}
                  title="Show a preview before printing"
                  description="Review label content, size, and orientation before sending a job."
                  onChange={(checked) => updateGeneralSetting({ showPrintPreview: checked }, { show_print_preview: String(checked) })}
                />
                <PreferenceToggle
                  checked={generalSettings.keepPrintHistory}
                  title="Keep a history of print jobs"
                  description="Retain completed and failed jobs for troubleshooting and reprinting."
                  onChange={(checked) => updateGeneralSetting({ keepPrintHistory: checked }, { keep_print_history: String(checked) })}
                />
              </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-start gap-3 border-b border-slate-200 px-6 py-5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-cyan-50 text-cyan-700">
              <FontAwesomeIcon icon={faMousePointer} />
            </div>
            <div>
              <h2 className="font-semibold text-slate-900">Designer behavior</h2>
              <p className="mt-1 text-xs leading-5 text-slate-600">Set up the canvas to match the way you normally design labels.</p>
            </div>
          </div>
          <div className="space-y-4 p-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-800">Grid spacing</label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={generalSettings.gridSize}
                    onChange={(event) => updateGeneralSetting({ gridSize: event.target.value }, { designer_grid_size: event.target.value })}
                    className={inputClass}
                  />
                  <span className="text-sm text-slate-600">px</span>
                </div>
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-800">Starting zoom</label>
                <select
                  value={generalSettings.defaultZoom}
                  onChange={(event) => updateGeneralSetting({ defaultZoom: event.target.value }, { designer_default_zoom: event.target.value })}
                  className={inputClass}
                >
                  <option value="fit">Fit artboard</option>
                  <option value="50">50%</option>
                  <option value="75">75%</option>
                  <option value="100">100%</option>
                  <option value="125">125%</option>
                  <option value="150">150%</option>
                </select>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <PreferenceToggle
                checked={generalSettings.showGridByDefault}
                title="Show grid on new labels"
                description="Display the positioning grid when the designer opens."
                onChange={(checked) => updateGeneralSetting({ showGridByDefault: checked }, { designer_show_grid: String(checked) })}
              />
              <PreferenceToggle
                checked={generalSettings.snapToGridByDefault}
                title="Snap items to grid"
                description="Align moved items to the nearest grid position."
                onChange={(checked) => updateGeneralSetting({ snapToGridByDefault: checked }, { designer_snap_to_grid: String(checked) })}
              />
            </div>
            <PreferenceToggle
              checked={generalSettings.confirmBeforeDelete}
              title="Confirm destructive actions"
              description="Ask before permanently deleting templates or important saved content."
              onChange={(checked) => updateGeneralSetting({ confirmBeforeDelete: checked }, { confirm_before_delete: String(checked) })}
            />
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-start gap-3 border-b border-slate-200 px-6 py-5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-700">
              <FontAwesomeIcon icon={faDisplay} />
            </div>
            <div>
              <h2 className="font-semibold text-slate-900">Appearance and comfort</h2>
              <p className="mt-1 text-xs leading-5 text-slate-600">Adjust the interface for your screen and accessibility needs.</p>
            </div>
          </div>
          <div className="space-y-4 p-6">
            <PreferenceToggle
              checked={generalSettings.compactInterface}
              title="Use a compact interface"
              description="Fit more controls on screen by reducing toolbar and panel spacing."
              onChange={(checked) => updateGeneralSetting({ compactInterface: checked }, { interface_compact: String(checked) })}
            />
            <PreferenceToggle
              checked={generalSettings.reduceMotion}
              title="Reduce animations"
              description="Minimize movement when reordering layers and opening interface elements."
              onChange={(checked) => updateGeneralSetting({ reduceMotion: checked }, { interface_reduce_motion: String(checked) })}
            />
            <PreferenceToggle
              checked={generalSettings.highContrast}
              title="Increase interface contrast"
              description="Use stronger borders and text contrast for improved readability."
              onChange={(checked) => updateGeneralSetting({ highContrast: checked }, { interface_high_contrast: String(checked) })}
            />
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-start gap-3 border-b border-slate-200 px-6 py-5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-rose-50 text-rose-700">
              <FontAwesomeIcon icon={faRocket} />
            </div>
            <div>
              <h2 className="font-semibold text-slate-900">When LabelForge starts</h2>
              <p className="mt-1 text-xs leading-5 text-slate-600">Choose what you want to see first when opening the application.</p>
            </div>
          </div>
          <div className="space-y-5 p-6">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-800">Open this page first</label>
              <select
                value={generalSettings.startPage}
                onChange={(event) => updateGeneralSetting({ startPage: event.target.value }, { start_page: event.target.value })}
                className={inputClass}
              >
                <option value="dashboard">Dashboard</option>
                <option value="templates">Template library</option>
                <option value="print">Print screen</option>
                <option value="printers">Printers</option>
              </select>
            </div>
            <PreferenceToggle
              checked={generalSettings.reopenLastTemplate}
              title="Reopen the last edited template"
              description="Return directly to unfinished design work after restarting the app."
              onChange={(checked) => updateGeneralSetting({ reopenLastTemplate: checked }, { reopen_last_template: String(checked) })}
            />
          </div>
        </section>
      </div>

      <section className="flex items-start gap-4 rounded-xl border border-slate-200 bg-slate-50 px-6 py-5">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white text-slate-600 shadow-sm ring-1 ring-slate-200">
          <FontAwesomeIcon icon={faDatabase} />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-slate-800">Your data stays on this computer</h2>
          <p className="mt-1 text-xs leading-5 text-slate-600">Templates, settings, and print history are stored locally. No external database server or sign-in is required.</p>
        </div>
      </section>

      <footer className="border-t border-slate-200 py-6 text-center text-xs text-slate-500">
        <div className="mt-2 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[11px] text-slate-400">
          <span>LabelForge Studio v{appVersion}</span>
          <span aria-hidden="true">•</span>
          <span>Proprietary License</span>
          <span aria-hidden="true">•</span>
          <span>All rights reserved</span>
        </div>
      </footer>
    </div>
  )
}
