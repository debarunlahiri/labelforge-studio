import type { Database as SqlJsDatabase } from 'sql.js'
import { v4 as uuidv4 } from 'uuid'

export function seedDatabase(db: SqlJsDatabase): void {
  const result = db.exec('SELECT COUNT(*) as count FROM global_variables')
  const count = result.length > 0 && result[0].values.length > 0 ? (result[0].values[0][0] as number) : 0
  if (count > 0) return

  const globalVariables = [
    { id: uuidv4(), key: 'company_name', value: 'LabelForge Studio', data_type: 'string', description: 'Company name' },
    { id: uuidv4(), key: 'plant_code', value: 'PL01', data_type: 'string', description: 'Plant code' },
    { id: uuidv4(), key: 'factory_address', value: '', data_type: 'string', description: 'Factory address' },
    { id: uuidv4(), key: 'gst_number', value: '', data_type: 'string', description: 'GST number' },
    { id: uuidv4(), key: 'default_label_prefix', value: 'LBL', data_type: 'string', description: 'Default label prefix' },
    { id: uuidv4(), key: 'current_financial_year', value: '2025-2026', data_type: 'string', description: 'Current financial year' },
  ]

  for (const v of globalVariables) {
    db.run('INSERT INTO global_variables (id, variable_key, variable_value, data_type, description) VALUES (?, ?, ?, ?, ?)', [v.id, v.key, v.value, v.data_type, v.description])
  }

  db.run('INSERT INTO system_settings (key, value) VALUES (?, ?)', ['auto_save_enabled', 'true'])
  db.run('INSERT INTO system_settings (key, value) VALUES (?, ?)', ['auto_save_interval_seconds', '30'])
}
