import { execFile, spawn } from 'child_process'
import net from 'net'
import os from 'os'
import { promisify } from 'util'

const execFileAsync = promisify(execFile)

export type PrinterLanguage = 'zpl' | 'epl' | 'tspl' | 'dpl' | 'cpcl' | 'escpos' | 'pdf'

export interface SupportedPrinterBrand {
  brand: string
  models: string[]
  defaultLanguage: PrinterLanguage
  printerType: string
}

export interface DiscoveredPrinter {
  name: string
  printer_type: string
  connection_type: string
  ip_address: string | null
  port: number | null
  machine_name: string | null
  driver_name: string | null
  dpi: number | null
  status: string
  language: PrinterLanguage
  supported: boolean
  matched_model: string | null
}

export const SUPPORTED_PRINTERS: SupportedPrinterBrand[] = [
  { brand: 'Zebra', defaultLanguage: 'zpl', printerType: 'thermal', models: ['ZD220', 'ZD230', 'ZD410', 'ZD411', 'ZD420', 'ZD421', 'ZD500R', 'ZD510', 'ZD611', 'ZD611R', 'ZD620', 'ZD621', 'ZD621R', 'ZD888', 'ZQ310', 'ZQ320', 'ZQ510', 'ZQ511', 'ZQ520', 'ZQ521', 'ZQ610', 'ZQ620', 'ZQ630', 'ZT111', 'ZT210', 'ZT211', 'ZT220', 'ZT230', 'ZT231', 'ZT231R', 'ZT410', 'ZT410R', 'ZT411', 'ZT411R', 'ZT420', 'ZT420R', 'ZT421', 'ZT421R', 'ZT510', 'ZT610', 'ZT610R', 'ZT620', 'ZT620R', 'ZE500', 'ZE500R', 'ZE511', 'ZE511R', 'ZE521', 'ZE521R', 'ZM400', 'ZM600', 'GK420D', 'GK420T', 'GC420D', 'GC420T', 'GX420D', 'GX420T', 'GX430D', 'GX430T', 'GT800', 'LP 2824', 'TLP 2824', 'LP 2844', 'TLP 2844', 'QL', 'QLN'] },
  { brand: 'TSC', defaultLanguage: 'tspl', printerType: 'thermal', models: ['ALPHA-2R', 'ALPHA-3R', 'ALPHA-4L', 'ALPHA-30L', 'ALPHA-40L', 'DA200', 'DA210', 'DA220', 'DA241', 'DA300', 'DA310', 'DA320', 'DA341', 'DH220', 'DH240', 'DH320', 'DH340', 'DL221', 'DL240', 'DL241', 'MB240', 'MB240T', 'MB241', 'MB241T', 'MB340', 'MB340T', 'MB341', 'MB341T', 'MB641', 'MB641T', 'ME240', 'ME340', 'MH200', 'MH240', 'MH241', 'MH261', 'MH300', 'MH340', 'MH341', 'MH361', 'MH600', 'MH640', 'MH641', 'ML240', 'ML241', 'ML340', 'ML341', 'MX240', 'MX241P', 'MX340', 'MX341P', 'MX640', 'MX641P', 'PEX'] },
  { brand: 'Honeywell', defaultLanguage: 'zpl', printerType: 'thermal', models: ['MPD31D', 'OD800', 'OT800', 'OT810', 'OT820', 'PC300T', 'PC310T', 'PC41E-D', 'PC42T', 'PC42E-T', 'PC42T PLUS', 'PC45T', 'PM42', 'PM45', 'PX940', 'PX940V'] },
  { brand: 'SATO', defaultLanguage: 'zpl', printerType: 'thermal', models: ['BF408R', 'BF412R', 'CG208DT', 'CG208TT', 'CG212DT', 'CG212TT', 'CG408DT', 'CG408TT', 'CG412DT', 'CG412TT', 'CG RFID', 'CL4-SXR', 'CL4NX', 'S84-EX', 'FX3-LX', 'M-8460S'] },
  { brand: 'TOSHIBA TEC', defaultLanguage: 'tspl', printerType: 'thermal', models: ['B-372', 'B-374', 'B-415', 'B-419', 'B-431', 'B-433', 'B-442', 'B-443', 'B-452', 'B-852', 'B-858', 'B-872', 'B-873', 'B-874', 'B-882', 'B-EP2', 'B-EP4', 'B-EV4', 'B-EX4T1', 'B-EX4T2', 'B-EX4T3', 'B-EX6T1', 'B-FP2D', 'B-FP3D', 'B-LV4', 'B-SA4T', 'B-SX4T', 'B-SX5T', 'B-SX6T', 'B-SX8T', 'BA400', 'BX410'] },
  { brand: 'Brother', defaultLanguage: 'zpl', printerType: 'thermal', models: ['PT-P700', 'PT-P750W', 'PT-P900W', 'PT-P950NW', 'PT-P9700PC', 'QL-500', 'QL-800', 'QL-810W', 'QL-820NWB', 'QL-1060N', 'QL-1100', 'QL-1110NWB', 'QL-1115NWB', 'RJ-2030', 'RJ-2035B', 'RJ-2050', 'RJ-2055WB', 'RJ-2140', 'RJ-2150', 'RJ-3035B', 'RJ-3050', 'RJ-3055WB', 'RJ-3150', 'RJ-3230B', 'RJ-3250WB', 'RJ-4230B', 'RJ-4250WB', 'TD-2020', 'TD-2030A', 'TD-2120N', 'TD-2125N', 'TD-2130N'] },
  { brand: 'Epson', defaultLanguage: 'escpos', printerType: 'inkjet-label', models: ['COLORWORKS C7500', 'C7500G', 'C7510', 'C7510G', 'C7520', 'C7520G', 'CW-C4000', 'CW-C4010', 'CW-C4020', 'CW-C4030', 'CW-C4040', 'CW-C4050', 'CW-C6000', 'CW-C6010', 'CW-C6020', 'CW-C6030', 'CW-C6040', 'CW-C6050', 'CW-C6500', 'CW-C6510', 'CW-C6520', 'CW-C6530', 'CW-C6540', 'CW-C6550', 'CW-C8000', 'CW-C8010', 'CW-C8020', 'CW-C8030', 'CW-C8040', 'CW-C8050'] },
  { brand: 'BIXOLON', defaultLanguage: 'tspl', printerType: 'thermal', models: ['BD5-40D', 'BD5-40T', 'BD5-43D', 'BD5-43T', 'BDP-D42', 'BDP-D43', 'BDP-T42', 'BDP-T43', 'BT3-40', 'BT3-43', 'BT5-40', 'BT5-43', 'BT5-46', 'BTP-42', 'BTP-43', 'BTP-46', 'SLP-D420', 'SLP-D423', 'SLP-DL410', 'SLP-DL413', 'SLP-DX220', 'SLP-DX223', 'SLP-DX420', 'SLP-DX423', 'SLP-T400', 'SLP-T403', 'SLP-TX220', 'SLP-TX223', 'SLP-TX400', 'SLP-TX403', 'SLP-TX420', 'SLP-TX423', 'SRP-770II', 'SRP-770III', 'SRP-S3000', 'XD3', 'XD5', 'XD7', 'XL5', 'XM5', 'XM7', 'XT2', 'XT3', 'XT5', 'XT6'] },
  { brand: 'Citizen', defaultLanguage: 'zpl', printerType: 'thermal', models: ['C-D2', 'C-D3', 'C-T2', 'C-T3', 'CL-E300', 'CL-E303', 'CL-E321', 'CL-E331', 'CL-E720'] },
  { brand: 'Godex', defaultLanguage: 'tspl', printerType: 'thermal', models: ['BP500L', 'BP50XL', 'BP520L', 'BP52XL', 'BP530L', 'BP53XL', 'BPZ436I PRO', 'DT2', 'DT2L', 'DT2X', 'DT4', 'DT200', 'DT200I', 'DT200L', 'DT230', 'DT230I', 'DT230L', 'DT43X'] },
  { brand: 'Argox', defaultLanguage: 'tspl', printerType: 'thermal', models: ['A-100', 'A-150', 'A-200', 'A-2140', 'A-2240', 'A-3140', 'A-50', 'AL-4210', 'AL-4310', 'PPLA', 'PPLB', 'PPLZ'] },
  { brand: 'Datamax-O\'Neil', defaultLanguage: 'dpl', printerType: 'thermal', models: ['ST-3210', 'ST-3306', 'SV-3210', 'SV-3306', 'TITAN 6200', 'W-6208', 'W-6308'] },
  { brand: 'Brady', defaultLanguage: 'zpl', printerType: 'thermal', models: ['BBP11', 'BBP12', 'BBP16', 'BBP72', 'BBP81', 'I6100', 'IP 300', 'IP 600', 'MINIMARK', 'PAM 2300', 'BRADYPRINTER 200M', '300MVP', '4000', '600X', 'I7100', 'T200', 'T300'] },
  { brand: 'cab', defaultLanguage: 'zpl', printerType: 'thermal', models: ['A2', 'A2+', 'A3', 'A4', 'A4+', 'A6', 'A8', 'APOLLO', 'AXON', 'CALYPSO', 'EOS1', 'EOS2', 'EOS4', 'EOS5', 'GEMINI', 'HERMES', 'HERMES Q'] },
]

export function getPrinterMatch(name = '', driverName = '') {
  const haystack = `${name} ${driverName}`.toUpperCase()
  for (const entry of SUPPORTED_PRINTERS) {
    if (haystack.includes(entry.brand.toUpperCase())) {
      const model = entry.models.find((m) => haystack.includes(m.toUpperCase())) || null
      return { ...entry, matchedModel: model }
    }
    const model = entry.models.find((m) => haystack.includes(m.toUpperCase()))
    if (model) return { ...entry, matchedModel: model }
  }
  return null
}

export function inferPrinterLanguage(printer: { name?: string | null; driver_name?: string | null; printer_type?: string | null }): PrinterLanguage {
  const match = getPrinterMatch(printer.name || '', printer.driver_name || '')
  if (match) return match.defaultLanguage
  const type = (printer.printer_type || '').toLowerCase()
  if (type.includes('zpl')) return 'zpl'
  if (type.includes('tspl')) return 'tspl'
  if (type.includes('epl')) return 'epl'
  if (type.includes('dpl')) return 'dpl'
  if (type.includes('cpcl')) return 'cpcl'
  return 'zpl'
}

export function normalizeDiscoveredPrinter(raw: any): DiscoveredPrinter {
  const name = raw.name || raw.displayName || raw.deviceName || 'Unknown printer'
  const driver = raw.driverName || raw.driver_name || raw.description || ''
  const match = getPrinterMatch(name, driver)
  return {
    name,
    printer_type: match?.printerType || 'system-printer',
    connection_type: inferConnectionType(raw),
    ip_address: raw.ipAddress || raw.ip_address || null,
    port: raw.port || null,
    machine_name: os.hostname(),
    driver_name: driver || name,
    dpi: inferDpi(`${name} ${driver}`),
    status: raw.status === 0 || raw.status === 'idle' ? 'available' : raw.status ? String(raw.status) : 'unknown',
    language: match?.defaultLanguage || inferPrinterLanguage({ name, driver_name: driver }),
    supported: Boolean(match),
    matched_model: match?.matchedModel || null,
  }
}

function inferConnectionType(raw: any): string {
  const source = `${raw.name || ''} ${raw.uri || ''} ${raw.options?.printerUri || ''}`.toLowerCase()
  if (source.includes('usb')) return 'usb'
  if (source.includes('bluetooth')) return 'bluetooth'
  if (source.includes('serial')) return 'serial'
  if (source.includes('socket://') || source.includes('ipp://') || source.includes('lpd://') || raw.ipAddress) return 'network'
  return 'driver'
}

function inferDpi(value: string): number | null {
  const match = value.match(/\b(203|300|600)\s*dpi\b/i)
  return match ? Number(match[1]) : null
}

export async function discoverSystemPrinters(electronPrinters: any[] = []): Promise<DiscoveredPrinter[]> {
  const discovered = new Map<string, DiscoveredPrinter>()
  for (const printer of electronPrinters) {
    const normalized = normalizeDiscoveredPrinter(printer)
    discovered.set(normalized.name, normalized)
  }

  if (process.platform !== 'win32') {
    try {
      const { stdout } = await execFileAsync('lpstat', ['-v'], { timeout: 5000 })
      for (const line of stdout.split('\n')) {
        const match = line.match(/^device for ([^:]+):\s*(.+)$/)
        if (!match) continue
        const existing = discovered.get(match[1]) || normalizeDiscoveredPrinter({ name: match[1] })
        existing.connection_type = inferConnectionType({ name: match[1], uri: match[2] })
        const socket = match[2].match(/socket:\/\/([^:/]+)(?::(\d+))?/)
        if (socket) {
          existing.ip_address = socket[1]
          existing.port = socket[2] ? Number(socket[2]) : 9100
        }
        discovered.set(existing.name, existing)
      }
    } catch {}
  }

  return [...discovered.values()].sort((a, b) => a.name.localeCompare(b.name))
}

export async function sendRawToPrinter(printer: any, payload: string): Promise<void> {
  const copies = Math.max(1, Number(printer.copies || 1))
  const body = Array.from({ length: copies }, () => payload).join('')

  if (printer.connection_type === 'network' && printer.ip_address) {
    await sendToSocket(printer.ip_address, Number(printer.port || 9100), body)
    return
  }

  if (!printer.name) throw new Error('Printer name is required for driver printing')

  if (process.platform === 'win32') {
    await runWithStdin('powershell.exe', ['-NoProfile', '-Command', `$p=[Console]::In.ReadToEnd(); Add-Content -Path "\\\\localhost\\${printer.name}" -Value $p -NoNewline`], body)
    return
  }

  const command = process.platform === 'darwin' || process.platform === 'linux' ? 'lp' : 'lpr'
  const args = command === 'lp' ? ['-d', printer.name, '-o', 'raw'] : ['-P', printer.name]
  await runWithStdin(command, args, body)
}

function sendToSocket(host: string, port: number, payload: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const socket = net.createConnection({ host, port, timeout: 10000 }, () => {
      socket.end(payload, 'utf8')
    })
    socket.on('close', () => resolve())
    socket.on('timeout', () => {
      socket.destroy()
      reject(new Error(`Timed out connecting to ${host}:${port}`))
    })
    socket.on('error', reject)
  })
}

function runWithStdin(command: string, args: string[], input: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: ['pipe', 'pipe', 'pipe'] })
    let stderr = ''
    const timer = setTimeout(() => {
      child.kill()
      reject(new Error(`${command} timed out`))
    }, 30000)
    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString()
    })
    child.on('error', (error) => {
      clearTimeout(timer)
      reject(error)
    })
    child.on('close', (code) => {
      clearTimeout(timer)
      if (code === 0) resolve()
      else reject(new Error(stderr.trim() || `${command} exited with code ${code}`))
    })
    child.stdin.end(input, 'utf8')
  })
}
