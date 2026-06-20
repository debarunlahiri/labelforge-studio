export type NewTemplateData = {
  name: string
  description: string
  label_width: number
  label_height: number
  unit: string
  dpi: number
  printer_type: string
  page_orientation: string
  rows: number
  columns: number
  margin_top: number
  margin_bottom: number
  margin_left: number
  margin_right: number
  gap_horizontal: number
  gap_vertical: number
}

export type DesignerContextMenuState = {
  x: number
  y: number
  objectId: string
} | null

export type AutoSaveStatus = 'idle' | 'pending' | 'saving' | 'saved' | 'error'
