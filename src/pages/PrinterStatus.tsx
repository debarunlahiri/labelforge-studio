import { useEffect, useState } from 'react'

export default function PrinterStatus() {
  const [printers, setPrinters] = useState<any[]>([])
  const [discoveredPrinters, setDiscoveredPrinters] = useState<any[]>([])
  const [isDiscovering, setIsDiscovering] = useState(false)
  const [supportedBrands, setSupportedBrands] = useState<any[]>([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    printer_type: 'thermal',
    connection_type: 'usb',
    ip_address: '',
    port: 9100,
    driver_name: '',
    dpi: 300,
  })

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
      setFormData({ name: '', printer_type: 'thermal', connection_type: 'usb', ip_address: '', port: 9100, driver_name: '', dpi: 300 })
      loadPrinters()
    } catch {}
  }

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
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Printers</h1>
        <div className="flex gap-3">
          <button
            onClick={handleDiscoverPrinters}
            disabled={isDiscovering}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium hover:bg-slate-50 disabled:opacity-50"
          >
            {isDiscovering ? 'Detecting...' : 'Detect Printers'}
          </button>
          <button
            onClick={() => setShowAddForm(true)}
            className="rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--color-primary-hover)]"
          >
            + Add Printer
          </button>
        </div>
      </div>

      {showAddForm && (
        <div className="rounded-xl border border-[var(--border-color)] bg-white p-7 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold">Add Printer</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium">Printer Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                placeholder="e.g., Zebra ZD420"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Type</label>
              <select
                value={formData.printer_type}
                onChange={(e) => setFormData({ ...formData, printer_type: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              >
                <option value="thermal">Thermal</option>
                <option value="laser">Laser</option>
                <option value="inkjet">Inkjet</option>
                <option value="rfid">RFID</option>
                <option value="pdf">PDF</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Connection</label>
              <select
                value={formData.connection_type}
                onChange={(e) => setFormData({ ...formData, connection_type: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              >
                <option value="usb">USB</option>
                <option value="network">Network</option>
                <option value="serial">Serial</option>
                <option value="bluetooth">Bluetooth</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">DPI</label>
              <select
                value={formData.dpi}
                onChange={(e) => setFormData({ ...formData, dpi: Number(e.target.value) })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              >
                <option value={203}>203 DPI</option>
                <option value={300}>300 DPI</option>
                <option value={600}>600 DPI</option>
              </select>
            </div>
            {formData.connection_type === 'network' && (
              <>
                <div>
                  <label className="mb-1 block text-sm font-medium">IP Address</label>
                  <input
                    type="text"
                    value={formData.ip_address}
                    onChange={(e) => setFormData({ ...formData, ip_address: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    placeholder="192.168.1.100"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Port</label>
                  <input
                    type="number"
                    value={formData.port}
                    onChange={(e) => setFormData({ ...formData, port: Number(e.target.value) })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
              </>
            )}
          </div>
          <div className="mt-4 flex justify-end gap-3">
            <button
              onClick={() => setShowAddForm(false)}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              onClick={handleAddPrinter}
              disabled={!formData.name.trim()}
              className="rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--color-primary-hover)] disabled:opacity-50"
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
