export interface Template {
  id: string
  name: string
  description: string | null
  label_width: number
  label_height: number
  unit: string
  dpi: number
  printer_type: string | null
  page_orientation: string
  rows: number
  columns: number
  margin_top: number
  margin_bottom: number
  margin_left: number
  margin_right: number
  gap_horizontal: number
  gap_vertical: number
  current_version_id: string | null
  status: string
  tags: string | null
  created_by: string
  created_at: string
  updated_at: string | null
}

export type TemplateStatus = 'Draft' | 'Pending Approval' | 'Approved' | 'Rejected' | 'Archived' | 'Locked'

export interface TemplateVersion {
  id: string
  template_id: string
  version_number: number
  template_json: string
  change_comment: string | null
  status: string
  created_by: string
  created_at: string
  approved_by: string | null
  approved_at: string | null
}

export type LabelObjectType = 'text' | 'barcode' | 'qrcode' | 'image' | 'shape' | 'line' | 'datetime' | 'counter' | 'database' | 'rfid'

export interface LabelObject {
  id: string
  type: LabelObjectType
  name: string
  x: number
  y: number
  width: number
  height: number
  rotation: number
  visible: boolean
  locked: boolean
  opacity: number
  data_source_binding?: string
  print_condition?: string
}

export interface TextObject extends LabelObject {
  type: 'text'
  value: string
  fontFamily: string
  fontSize: number
  bold: boolean
  italic: boolean
  underline: boolean
  textColor: string
  backgroundColor: string
  horizontalAlign: string
  verticalAlign: string
  lineHeight: number
  letterSpacing: number
  wordWrap: boolean
  autoShrink: boolean
}

export interface BarcodeObject extends LabelObject {
  type: 'barcode'
  barcodeType: string
  value: string
  showHumanReadable: boolean
  humanReadablePosition: string
  moduleWidth: number
  barcodeHeight: number
  quietZone: number
  foregroundColor: string
  backgroundColor: string
}

export interface QRCodeObject extends LabelObject {
  type: 'qrcode'
  barcodeType?: string
  value: string
  errorCorrectionLevel: string
  quietZone: number
  foregroundColor: string
  backgroundColor: string
}

export interface ImageObject extends LabelObject {
  type: 'image'
  source: string
  sourceType: 'embedded' | 'file' | 'database' | 'url'
  maintainAspectRatio: boolean
}

export interface ShapeObject extends LabelObject {
  type: 'shape'
  shapeType: 'rectangle' | 'roundedRectangle' | 'circle' | 'ellipse' | 'triangle' | 'polygon'
  fillColor: string
  borderColor: string
  borderWidth: number
  cornerRadius: number
}

export interface LineObject extends LabelObject {
  type: 'line'
  startX: number
  startY: number
  endX: number
  endY: number
  lineColor: string
  lineThickness: number
  lineStyle: 'solid' | 'dashed' | 'dotted'
  arrowStart: boolean
  arrowEnd: boolean
}

export interface DateTimeObject extends LabelObject {
  type: 'datetime'
  format: string
  offset: number
  offsetUnit: 'days' | 'months' | 'years'
}

export interface CounterObject extends LabelObject {
  type: 'counter'
  startValue: number
  endValue: number
  increment: number
  prefix: string
  suffix: string
  padding: number
  resetType: 'never' | 'daily' | 'monthly' | 'yearly' | 'perTemplate'
}

export interface TemplateCanvas {
  width: number
  height: number
  unit: string
  dpi: number
  objects: LabelObject[]
  dataSources: DataSourceConfig[]
  printSettings: PrintSettings
}

export interface DataSourceConfig {
  id: string
  name: string
  type: 'static' | 'csv' | 'excel' | 'sqlite' | 'postgresql' | 'mysql' | 'sqlserver' | 'json' | 'xml' | 'printTimeInput' | 'counter' | 'globalVariable' | 'formula'
  config: Record<string, any>
  isDefault: boolean
}

export interface PrintSettings {
  copies: number
  printerLanguage: 'pdf' | 'zpl' | 'epl' | 'tspl' | 'dpl' | 'cpcl' | 'escpos'
}

export interface Printer {
  id: string
  name: string
  printer_type: string | null
  connection_type: string | null
  ip_address: string | null
  port: number | null
  machine_name: string | null
  driver_name: string | null
  dpi: number | null
  status: string
  is_active: number
  last_seen: string | null
  created_at: string
  updated_at: string | null
}

export interface PrintJob {
  id: string
  template_id: string
  template_version_id: string
  printer_id: string
  requested_by: string | null
  copies: number
  payload_json: string | null
  status: string
  error_message: string | null
  created_at: string
  started_at: string | null
  completed_at: string | null
}

export type PrintJobStatus = 'Pending' | 'Queued' | 'Rendering' | 'Sending' | 'Printing' | 'Completed' | 'Failed' | 'Cancelled' | 'Retrying' | 'Paused'

export interface GlobalVariable {
  id: string
  variable_key: string
  variable_value: string | null
  data_type: string
  description: string | null
  is_active: number
  created_at: string
  updated_at: string | null
}

export interface AuditLog {
  id: string
  timestamp: string
  user_id: string | null
  username: string | null
  action: string
  module: string | null
  entity_type: string | null
  entity_id: string | null
  old_value: string | null
  new_value: string | null
  ip_address: string | null
  machine_name: string | null
  status: string | null
  error_message: string | null
}

export type BarcodeType = 'Code128' | 'Code39' | 'EAN13' | 'EAN8' | 'UPCA' | 'UPCE' | 'QRCode' | 'DataMatrix' | 'PDF417' | 'ITF14' | 'GS1128' | 'GS1DataMatrix'

export type DataSourceType = 'static' | 'csv' | 'excel' | 'sqlite' | 'postgresql' | 'mysql' | 'sqlserver' | 'json' | 'xml' | 'printTimeInput' | 'counter' | 'globalVariable' | 'formula'
