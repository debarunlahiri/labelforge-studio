import { useEffect, useState } from 'react'
import SearchableSelect from '../components/SearchableSelect'
import PageHero from '../components/PageHero'
import { faPrint } from '@fortawesome/free-solid-svg-icons'

type SupportedPrinterBrand = {
  brand: string
  models: string[]
  defaultLanguage: string
  printerType: string
}

const emptyForm = {
  name: '',
  printer_type: 'thermal',
  connection_type: 'usb',
  ip_address: '',
  port: 9100,
  driver_name: '',
  dpi: 300,
}

export default function PrinterStatus() {
  const [printers, setPrinters] = useState<any[]>([])
  const [discoveredPrinters, setDiscoveredPrinters] = useState<any[]>([])
  const [isDiscovering, setIsDiscovering] = useState(false)
  const [supportedBrands, setSupportedBrands] = useState<SupportedPrinterBrand[]>([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [selectedCatalogPrinter, setSelectedCatalogPrinter] = useState('')
  const [selectedBrandName, setSelectedBrandName] = useState('')
  const [selectedDetectedPrinter, setSelectedDetectedPrinter] = useState('')
  const [formData, setFormData] = useState(emptyForm)

  useEffect(() => {
    loadPrinters()
    loadSupportedBrands()
  }, [])

  const loadPrinters = async () => {
    try {
      const data = await window.electronAPI?.printers.list() || []
      setPrinters(data)
    } catch {}
  }

  const loadSupportedBrands = async () => {
    try {
      const data = await window.electronAPI?.printers.supportedModels() || []
      setSupportedBrands(data)
    } catch {}
  }

  const handleDiscoverPrinters = async () => {
    setIsDiscovering(true)
    try {
      const data = await window.electronAPI?.printers.discover() || []
      setDiscoveredPrinters(data)
      if (data.length > 0) setShowAddForm(true)
    } finally {
      setIsDiscovering(false)
    }
  }

  const handleRegisterDiscovered = async (printer: any) => {
    const result = await window.electronAPI?.printers.registerDiscovered(printer)
    if (result?.success === false) {
      alert(result.error || 'Failed to register printer')
      return
    }
    await loadPrinters()
  }

  const handleAddPrinter = async () => {
    if (!formData.name.trim()) return
    try {
      await window.electronAPI?.printers.register(formData)
      setShowAddForm(false)
      setSelectedCatalogPrinter('')
      setSelectedBrandName('')
      setSelectedDetectedPrinter('')
      setFormData(emptyForm)
      loadPrinters()
    } catch {}
  }

  const handleCatalogSelection = (value: string) => {
    setSelectedCatalogPrinter(value)
    setSelectedDetectedPrinter('')
    if (!value) return
    if (value === 'other') {
      setFormData(emptyForm)
      return
    }

    const [brand, model] = value.split('::')
    const printer = supportedBrands.find((entry) => entry.brand === brand)
    if (!printer) return
    setFormData({
      ...emptyForm,
      name: `${brand} ${model}`,
      printer_type: printer.printerType,
      driver_name: `${brand} ${model}`,
      dpi: 203,
    })
  }

  const handleBrandSelection = (brand: string) => {
    setSelectedBrandName(brand)
    setSelectedCatalogPrinter(brand === 'other' ? 'other' : '')
    setSelectedDetectedPrinter('')
    setFormData(emptyForm)
  }

  const handleDetectedSelection = (value: string) => {
    setSelectedDetectedPrinter(value)
    if (!value) return
    const printer = discoveredPrinters[Number(value)]
    if (!printer) return
    const matchedBrand = supportedBrands.find((entry) => entry.models.includes(printer.matched_model))
    setSelectedBrandName(matchedBrand?.brand || 'other')
    setSelectedCatalogPrinter(
      printer.supported && printer.matched_model && matchedBrand
        ? `${matchedBrand.brand}::${printer.matched_model}`
        : 'other',
    )
    setFormData({
      name: printer.name || 'Detected printer',
      printer_type: printer.printer_type || 'system-printer',
      connection_type: printer.connection_type || 'driver',
      ip_address: printer.ip_address || '',
      port: printer.port || 9100,
      driver_name: printer.driver_name || printer.name || '',
      dpi: printer.dpi || 300,
    })
  }

  const selectedBrand = selectedCatalogPrinter && selectedCatalogPrinter !== 'other'
    ? supportedBrands.find((entry) => entry.brand === selectedCatalogPrinter.split('::')[0])
    : null
  const isOtherPrinter = selectedCatalogPrinter === 'other'
  const isDriverConnection = formData.connection_type === 'driver'

  const handleDelete = async (id: string) => {
    if (confirm('Remove this printer?')) {
      await window.electronAPI?.printers.delete(id)
      loadPrinters()
    }
  }

  const statusColors: Record<string, string> = {
    available: 'bg-green-100 text-green-700',
    offline: 'bg-red-100 text-red-700',
    busy: 'bg-yellow-100 text-yellow-700',
    error: 'bg-red-100 text-red-700',
    unknown: 'bg-gray-100 text-gray-600',
  }

  return (
    <div className="space-y-7">
      <PageHero
        eyebrow="Device management"
        title="Printers"
        description="Detect, configure, and monitor printers used by your production workspace."
        icon={faPrint}
        accent="cyan"
        actions={<>
          <button
            onClick={handleDiscoverPrinters}
            disabled={isDiscovering}
            className="rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10 disabled:opacity-50"
          >
            {isDiscovering ? 'Detecting...' : 'Detect Printers'}
          </button>
          <button
            onClick={() => {
              setShowAddForm(true)
              setSelectedCatalogPrinter('')
              setSelectedBrandName('')
              setSelectedDetectedPrinter('')
              setFormData(emptyForm)
            }}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500"
          >
            + Add Printer
          </button>
        </>}
      />

      {showAddForm && (
        <div className="overflow-hidden rounded-2xl border border-[var(--border-color)] bg-white shadow-sm">
          <div className="flex items-start justify-between gap-4 border-b border-slate-200 bg-slate-50/70 px-7 py-5">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Add Printer</h2>
              <p className="mt-1 text-sm text-slate-500">Choose a supported model, use a detected printer, or configure another printer manually.</p>
            </div>
            <button
              onClick={() => setShowAddForm(false)}
              className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-500 hover:bg-slate-200/70 hover:text-slate-800"
            >
              Close
            </button>
          </div>

          <div className="grid gap-6 p-7 lg:grid-cols-[minmax(0,1.4fr)_minmax(300px,0.6fr)]">
            <div className="space-y-6">
              <section>
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">1. Select printer</h3>
                    <p className="mt-0.5 text-xs text-slate-500">Known models automatically load compatible defaults.</p>
                  </div>
                  {selectedBrand && (
                    <span className="rounded-full bg-green-50 px-2.5 py-1 text-[11px] font-semibold uppercase text-green-700">
                      {selectedBrand.defaultLanguage}
                    </span>
                  )}
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-slate-600">Brand</label>
                    <SearchableSelect
                      value={selectedBrandName}
                      onChange={handleBrandSelection}
                      placeholder="Select brand..."
                      searchPlaceholder="Search brands..."
                      options={[
                        ...supportedBrands.map((brand) => ({ value: brand.brand, label: brand.brand, description: `${brand.models.length} models` })),
                        { value: 'other', label: 'Other / Not listed', description: 'Configure manually' },
                      ]}
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-slate-600">Model</label>
                    <SearchableSelect
                      value={selectedCatalogPrinter}
                      onChange={handleCatalogSelection}
                      placeholder={selectedBrandName ? 'Select model...' : 'Select brand first'}
                      searchPlaceholder="Search models..."
                      disabled={!selectedBrandName}
                      options={selectedBrandName === 'other'
                        ? [{ value: 'other', label: 'Other / Custom printer' }]
                        : (supportedBrands.find((brand) => brand.brand === selectedBrandName)?.models || []).map((model) => ({
                            value: `${selectedBrandName}::${model}`,
                            label: model,
                            description: selectedBrandName,
                          }))}
                    />
                  </div>
                </div>

                {discoveredPrinters.length > 0 && (
                  <div className="mt-3">
                    <label className="mb-1.5 block text-xs font-semibold text-slate-600">Or use a detected printer</label>
                    <select
                      value={selectedDetectedPrinter}
                      onChange={(e) => handleDetectedSelection(e.target.value)}
                      className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    >
                      <option value="">Select detected printer...</option>
                      {discoveredPrinters.map((printer, index) => (
                        <option key={`${printer.name}-${index}`} value={index}>
                          {printer.name} — {printer.matched_model || 'Other'}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </section>

              {(selectedCatalogPrinter || selectedDetectedPrinter) && (
                <section className="border-t border-slate-200 pt-5">
                  <h3 className="mb-4 text-sm font-semibold text-slate-900">2. Printer settings</h3>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                        {isOtherPrinter ? 'Printer name *' : 'Display name *'}
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="h-11 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        placeholder={isOtherPrinter ? 'Enter the detected or custom printer name' : 'Printer name'}
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-slate-700">Printer type</label>
                      <select
                        value={formData.printer_type}
                        onChange={(e) => setFormData({ ...formData, printer_type: e.target.value })}
                        className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm"
                      >
                        <option value="thermal">Thermal label</option>
                        <option value="inkjet-label">Inkjet label</option>
                        <option value="laser">Laser</option>
                        <option value="inkjet">Inkjet</option>
                        <option value="rfid">RFID</option>
                        <option value="system-printer">System printer</option>
                        <option value="pdf">PDF</option>
                      </select>
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-slate-700">Resolution</label>
                      <select
                        value={formData.dpi}
                        onChange={(e) => setFormData({ ...formData, dpi: Number(e.target.value) })}
                        className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm"
                      >
                        <option value={203}>203 DPI</option>
                        <option value={300}>300 DPI</option>
                        <option value={600}>600 DPI</option>
                      </select>
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-slate-700">Connection</label>
                      <select
                        value={formData.connection_type}
                        onChange={(e) => setFormData({ ...formData, connection_type: e.target.value })}
                        className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm"
                      >
                        <option value="usb">USB</option>
                        <option value="network">Network</option>
                        <option value="driver">System driver</option>
                        <option value="serial">Serial</option>
                        <option value="bluetooth">Bluetooth</option>
                      </select>
                    </div>
                    {(isDriverConnection || isOtherPrinter) && (
                      <div>
                        <label className="mb-1.5 block text-xs font-semibold text-slate-700">Driver / queue name</label>
                        <input
                          type="text"
                          value={formData.driver_name}
                          onChange={(e) => setFormData({ ...formData, driver_name: e.target.value })}
                          className="h-11 w-full rounded-lg border border-slate-300 px-3 text-sm"
                          placeholder="Operating system printer name"
                        />
                      </div>
                    )}
                    {formData.connection_type === 'network' && (
                      <>
                        <div>
                          <label className="mb-1.5 block text-xs font-semibold text-slate-700">IP address</label>
                          <input
                            type="text"
                            value={formData.ip_address}
                            onChange={(e) => setFormData({ ...formData, ip_address: e.target.value })}
                            className="h-11 w-full rounded-lg border border-slate-300 px-3 text-sm"
                            placeholder="192.168.1.100"
                          />
                        </div>
                        <div>
                          <label className="mb-1.5 block text-xs font-semibold text-slate-700">Raw print port</label>
                          <input
                            type="number"
                            value={formData.port}
                            onChange={(e) => setFormData({ ...formData, port: Number(e.target.value) })}
                            className="h-11 w-full rounded-lg border border-slate-300 px-3 text-sm"
                          />
                        </div>
                      </>
                    )}
                  </div>
                </section>
              )}
            </div>

            <aside className="rounded-xl border border-slate-200 bg-slate-50 p-5">
              <h3 className="text-sm font-semibold text-slate-900">Configuration summary</h3>
              {!selectedCatalogPrinter && !selectedDetectedPrinter ? (
                <p className="mt-3 text-sm leading-6 text-slate-500">Select a printer to view and customize its settings.</p>
              ) : (
                <div className="mt-4 space-y-3 text-sm">
                  <div>
                    <div className="text-xs text-slate-500">Printer</div>
                    <div className="mt-0.5 font-semibold text-slate-900">{formData.name || 'Unnamed printer'}</div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 border-t border-slate-200 pt-3">
                    <div><div className="text-xs text-slate-500">Type</div><div className="mt-0.5 capitalize">{formData.printer_type.replace('-', ' ')}</div></div>
                    <div><div className="text-xs text-slate-500">DPI</div><div className="mt-0.5">{formData.dpi}</div></div>
                    <div><div className="text-xs text-slate-500">Connection</div><div className="mt-0.5 capitalize">{formData.connection_type}</div></div>
                    <div><div className="text-xs text-slate-500">Language</div><div className="mt-0.5 uppercase">{selectedBrand?.defaultLanguage || 'Auto detect'}</div></div>
                  </div>
                  {selectedDetectedPrinter && (
                    <div className="rounded-lg bg-blue-50 px-3 py-2 text-xs leading-5 text-blue-700">
                      Settings were populated from the detected printer. You can rename it before adding.
                    </div>
                  )}
                  {isOtherPrinter && (
                    <div className="rounded-lg bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-700">
                      This printer is not in the supported catalog. Its entered or detected name will be preserved.
                    </div>
                  )}
                </div>
              )}
            </aside>
          </div>

          <div className="flex justify-end gap-3 border-t border-slate-200 bg-slate-50/70 px-7 py-4">
            <button
              onClick={() => setShowAddForm(false)}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              onClick={handleAddPrinter}
              disabled={!formData.name.trim() || (!selectedCatalogPrinter && !selectedDetectedPrinter)}
              className="rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--color-primary-hover)] disabled:cursor-not-allowed disabled:opacity-40"
            >
              Add Printer
            </button>
          </div>
        </div>
      )}

      <div className="rounded-xl border border-[var(--border-color)] bg-white p-7 shadow-sm">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">Detected Printers</h2>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">
              Uses the operating system print subsystem and raw socket details where available.
            </p>
          </div>
          <div className="shrink-0 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-[var(--text-secondary)]">
            {supportedBrands.length} supported brands
          </div>
        </div>
        {discoveredPrinters.length === 0 ? (
          <div className="rounded-lg bg-slate-50 px-5 py-4 text-sm text-[var(--text-secondary)]">
            Run detection to find installed USB, network, Bluetooth, serial, and driver-backed printers.
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-slate-200">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-[var(--text-secondary)]">
                <tr>
                  <th className="px-4 py-3">Printer</th>
                  <th className="px-4 py-3">Model</th>
                  <th className="px-4 py-3">Language</th>
                  <th className="px-4 py-3">Connection</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {discoveredPrinters.map((printer: any) => (
                  <tr key={`${printer.name}-${printer.driver_name}`} className="border-t border-slate-100">
                    <td className="px-4 py-3">
                      <div className="font-medium">{printer.name}</div>
                      <div className="text-xs text-[var(--text-secondary)]">{printer.driver_name || 'System driver'}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={printer.supported ? 'text-green-700' : 'text-orange-700'}>
                        {printer.matched_model || (printer.supported ? 'Supported' : 'Unmatched')}
                      </span>
                    </td>
                    <td className="px-4 py-3 uppercase">{printer.language}</td>
                    <td className="px-4 py-3">
                      {printer.connection_type}
                      {printer.ip_address ? ` ${printer.ip_address}:${printer.port || 9100}` : ''}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleRegisterDiscovered(printer)}
                        className="rounded-md bg-[var(--color-primary)] px-3 py-1.5 text-xs font-medium text-white hover:bg-[var(--color-primary-hover)]"
                      >
                        Register
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {printers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="mb-4 text-6xl text-slate-300">⌨</div>
          <h3 className="mb-2 text-lg font-semibold text-[var(--text-secondary)]">No printers registered</h3>
          <p className="text-sm text-[var(--text-secondary)]">Add a printer to start printing labels</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {printers.map((printer: any) => (
            <div
              key={printer.id}
              className="rounded-xl border border-[var(--border-color)] bg-white p-6 shadow-sm"
            >
              <div className="mb-3 flex items-start justify-between">
                <div>
                  <h3 className="font-semibold">{printer.name}</h3>
                  <p className="text-xs text-[var(--text-secondary)]">
                    {printer.printer_type || 'Unknown type'}
                  </p>
                </div>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusColors[printer.status] || statusColors.unknown}`}>
                  {printer.status}
                </span>
              </div>
              <div className="space-y-2 text-xs text-[var(--text-secondary)]">
                <div className="flex justify-between">
                  <span>Connection:</span>
                  <span>{printer.connection_type || 'Unknown'}</span>
                </div>
                <div className="flex justify-between">
                  <span>DPI:</span>
                  <span>{printer.dpi || 'Unknown'}</span>
                </div>
                {printer.ip_address && (
                  <div className="flex justify-between">
                    <span>IP:</span>
                    <span>{printer.ip_address}:{printer.port}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Last seen:</span>
                  <span>{printer.last_seen ? new Date(printer.last_seen).toLocaleDateString() : 'Never'}</span>
                </div>
              </div>
              <div className="mt-3 flex justify-end">
                <button
                  onClick={() => handleDelete(printer.id)}
                  className="text-xs text-red-500 hover:underline"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
