import { useState } from 'react'
import type { DataSourceConfig, DataSourceType } from '../types'
import { useDesignerStore } from '../store/designerStore'
import { v4 as uuidv4 } from 'uuid'

const DATA_SOURCE_TYPES: { value: DataSourceType; label: string }[] = [
  { value: 'static', label: 'Static' },
  { value: 'csv', label: 'CSV' },
  { value: 'excel', label: 'Excel' },
  { value: 'sqlite', label: 'SQLite' },
  { value: 'postgresql', label: 'PostgreSQL' },
  { value: 'mysql', label: 'MySQL' },
  { value: 'sqlserver', label: 'SQL Server' },
  { value: 'json', label: 'JSON' },
  { value: 'printTimeInput', label: 'Print-time Input' },
  { value: 'counter', label: 'Counter' },
  { value: 'globalVariable', label: 'Global Variable' },
  { value: 'formula', label: 'Formula' },
]

interface DataSourcePanelProps {
  dataSources: DataSourceConfig[]
  onChange: (dataSources: DataSourceConfig[]) => void
  onMapField?: (dataSourceId: string, fieldName: string, objectId: string) => void
}

interface FieldMapping {
  fieldName: string
  objectId: string | null
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getEmptyConfig(type: DataSourceType): Record<string, any> {
  switch (type) {
    case 'static':
      return { value: '' }
    case 'csv':
      return { filePath: '', delimiter: ',', hasHeader: true }
    case 'excel':
      return { filePath: '', sheetName: 'Sheet1' }
    case 'sqlite':
      return { filePath: '', query: '' }
    case 'postgresql':
    case 'mysql':
    case 'sqlserver':
      return { host: 'localhost', port: type === 'postgresql' ? 5432 : type === 'mysql' ? 3306 : 1433, database: '', username: '', password: '', query: '' }
    case 'json':
      return { filePath: '', jsonPath: '' }
    case 'printTimeInput':
      return { label: '', inputType: 'text', validation: { required: false, minLength: 0, maxLength: 0, pattern: '' } }
    case 'counter':
      return { start: 1, end: 9999, increment: 1, prefix: '', suffix: '', padding: 4, resetType: 'never' }
    case 'globalVariable':
      return { variableKey: '' }
    case 'formula':
      return { expression: '' }
    default:
      return {}
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function DataSourceConfigFields({ type, config, onChange }: { type: DataSourceType; config: Record<string, any>; onChange: (config: Record<string, any>) => void }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleFieldChange = (key: string, value: any) => {
    onChange({ ...config, [key]: value })
  }

  switch (type) {
    case 'static':
      return (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <label className="w-20 text-[11px] text-[var(--text-secondary)]">Value</label>
            <input
              type="text"
              value={config.value || ''}
              onChange={(e) => handleFieldChange('value', e.target.value)}
              className="flex-1 rounded border border-slate-300 px-2 py-1 text-[11px]"
            />
          </div>
        </div>
      )

    case 'csv':
      return (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <label className="w-20 text-[11px] text-[var(--text-secondary)]">File Path</label>
            <input
              type="text"
              value={config.filePath || ''}
              onChange={(e) => handleFieldChange('filePath', e.target.value)}
              className="flex-1 rounded border border-slate-300 px-2 py-1 text-[11px]"
              placeholder="/path/to/data.csv"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="w-20 text-[11px] text-[var(--text-secondary)]">Delimiter</label>
            <select
              value={config.delimiter || ','}
              onChange={(e) => handleFieldChange('delimiter', e.target.value)}
              className="flex-1 rounded border border-slate-300 px-1 py-1 text-[11px]"
            >
              <option value=",">Comma (,)</option>
              <option value=";">Semicolon (;)</option>
              <option value="\t">Tab</option>
              <option value="|">Pipe (|)</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="w-20 text-[11px] text-[var(--text-secondary)]">Has Header</label>
            <input
              type="checkbox"
              checked={config.hasHeader ?? true}
              onChange={(e) => handleFieldChange('hasHeader', e.target.checked)}
              className="h-3.5 w-3.5"
            />
          </div>
        </div>
      )

    case 'excel':
      return (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <label className="w-20 text-[11px] text-[var(--text-secondary)]">File Path</label>
            <input
              type="text"
              value={config.filePath || ''}
              onChange={(e) => handleFieldChange('filePath', e.target.value)}
              className="flex-1 rounded border border-slate-300 px-2 py-1 text-[11px]"
              placeholder="/path/to/data.xlsx"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="w-20 text-[11px] text-[var(--text-secondary)]">Sheet Name</label>
            <input
              type="text"
              value={config.sheetName || 'Sheet1'}
              onChange={(e) => handleFieldChange('sheetName', e.target.value)}
              className="flex-1 rounded border border-slate-300 px-2 py-1 text-[11px]"
            />
          </div>
        </div>
      )

    case 'sqlite':
      return (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <label className="w-20 text-[11px] text-[var(--text-secondary)]">File Path</label>
            <input
              type="text"
              value={config.filePath || ''}
              onChange={(e) => handleFieldChange('filePath', e.target.value)}
              className="flex-1 rounded border border-slate-300 px-2 py-1 text-[11px]"
              placeholder="/path/to/database.db"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="w-20 text-[11px] text-[var(--text-secondary)]">Query</label>
            <textarea
              value={config.query || ''}
              onChange={(e) => handleFieldChange('query', e.target.value)}
              className="flex-1 rounded border border-slate-300 px-2 py-1 text-[11px] font-mono"
              rows={3}
              placeholder="SELECT * FROM table"
            />
          </div>
        </div>
      )

    case 'postgresql':
    case 'mysql':
    case 'sqlserver':
      return (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <label className="w-20 text-[11px] text-[var(--text-secondary)]">Host</label>
            <input
              type="text"
              value={config.host || 'localhost'}
              onChange={(e) => handleFieldChange('host', e.target.value)}
              className="flex-1 rounded border border-slate-300 px-2 py-1 text-[11px]"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="w-20 text-[11px] text-[var(--text-secondary)]">Port</label>
            <input
              type="number"
              value={config.port || ''}
              onChange={(e) => handleFieldChange('port', Number(e.target.value))}
              className="flex-1 rounded border border-slate-300 px-2 py-1 text-[11px]"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="w-20 text-[11px] text-[var(--text-secondary)]">Database</label>
            <input
              type="text"
              value={config.database || ''}
              onChange={(e) => handleFieldChange('database', e.target.value)}
              className="flex-1 rounded border border-slate-300 px-2 py-1 text-[11px]"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="w-20 text-[11px] text-[var(--text-secondary)]">Username</label>
            <input
              type="text"
              value={config.username || ''}
              onChange={(e) => handleFieldChange('username', e.target.value)}
              className="flex-1 rounded border border-slate-300 px-2 py-1 text-[11px]"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="w-20 text-[11px] text-[var(--text-secondary)]">Password</label>
            <input
              type="password"
              value={config.password || ''}
              onChange={(e) => handleFieldChange('password', e.target.value)}
              className="flex-1 rounded border border-slate-300 px-2 py-1 text-[11px]"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="w-20 text-[11px] text-[var(--text-secondary)]">Query</label>
            <textarea
              value={config.query || ''}
              onChange={(e) => handleFieldChange('query', e.target.value)}
              className="flex-1 rounded border border-slate-300 px-2 py-1 text-[11px] font-mono"
              rows={3}
              placeholder="SELECT * FROM table"
            />
          </div>
        </div>
      )

    case 'json':
      return (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <label className="w-20 text-[11px] text-[var(--text-secondary)]">File Path</label>
            <input
              type="text"
              value={config.filePath || ''}
              onChange={(e) => handleFieldChange('filePath', e.target.value)}
              className="flex-1 rounded border border-slate-300 px-2 py-1 text-[11px]"
              placeholder="/path/to/data.json"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="w-20 text-[11px] text-[var(--text-secondary)]">JSON Path</label>
            <input
              type="text"
              value={config.jsonPath || ''}
              onChange={(e) => handleFieldChange('jsonPath', e.target.value)}
              className="flex-1 rounded border border-slate-300 px-2 py-1 text-[11px]"
              placeholder="$.data[*]"
            />
          </div>
        </div>
      )

    case 'printTimeInput':
      return (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <label className="w-20 text-[11px] text-[var(--text-secondary)]">Label</label>
            <input
              type="text"
              value={config.label || ''}
              onChange={(e) => handleFieldChange('label', e.target.value)}
              className="flex-1 rounded border border-slate-300 px-2 py-1 text-[11px]"
              placeholder="Enter label"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="w-20 text-[11px] text-[var(--text-secondary)]">Input Type</label>
            <select
              value={config.inputType || 'text'}
              onChange={(e) => handleFieldChange('inputType', e.target.value)}
              className="flex-1 rounded border border-slate-300 px-1 py-1 text-[11px]"
            >
              <option value="text">Text</option>
              <option value="number">Number</option>
              <option value="date">Date</option>
              <option value="dropdown">Dropdown</option>
            </select>
          </div>
          {(config.inputType === 'dropdown') && (
            <div className="flex items-center gap-2">
              <label className="w-20 text-[11px] text-[var(--text-secondary)]">Options</label>
              <input
                type="text"
                value={config.options || ''}
                onChange={(e) => handleFieldChange('options', e.target.value)}
                className="flex-1 rounded border border-slate-300 px-2 py-1 text-[11px]"
                placeholder="Option1, Option2, ..."
              />
            </div>
          )}
          <div className="flex items-center gap-2">
            <label className="w-20 text-[11px] text-[var(--text-secondary)]">Required</label>
            <input
              type="checkbox"
              checked={config.validation?.required ?? false}
              onChange={(e) => handleFieldChange('validation', { ...config.validation, required: e.target.checked })}
              className="h-3.5 w-3.5"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="w-20 text-[11px] text-[var(--text-secondary)]">Min Length</label>
            <input
              type="number"
              value={config.validation?.minLength || 0}
              onChange={(e) => handleFieldChange('validation', { ...config.validation, minLength: Number(e.target.value) })}
              className="flex-1 rounded border border-slate-300 px-2 py-1 text-[11px]"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="w-20 text-[11px] text-[var(--text-secondary)]">Max Length</label>
            <input
              type="number"
              value={config.validation?.maxLength || 0}
              onChange={(e) => handleFieldChange('validation', { ...config.validation, maxLength: Number(e.target.value) })}
              className="flex-1 rounded border border-slate-300 px-2 py-1 text-[11px]"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="w-20 text-[11px] text-[var(--text-secondary)]">Pattern</label>
            <input
              type="text"
              value={config.validation?.pattern || ''}
              onChange={(e) => handleFieldChange('validation', { ...config.validation, pattern: e.target.value })}
              className="flex-1 rounded border border-slate-300 px-2 py-1 text-[11px] font-mono"
              placeholder="Regex pattern"
            />
          </div>
        </div>
      )

    case 'counter':
      return (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <label className="w-20 text-[11px] text-[var(--text-secondary)]">Start</label>
            <input
              type="number"
              value={config.start ?? 1}
              onChange={(e) => handleFieldChange('start', Number(e.target.value))}
              className="flex-1 rounded border border-slate-300 px-2 py-1 text-[11px]"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="w-20 text-[11px] text-[var(--text-secondary)]">End</label>
            <input
              type="number"
              value={config.end ?? 9999}
              onChange={(e) => handleFieldChange('end', Number(e.target.value))}
              className="flex-1 rounded border border-slate-300 px-2 py-1 text-[11px]"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="w-20 text-[11px] text-[var(--text-secondary)]">Increment</label>
            <input
              type="number"
              value={config.increment ?? 1}
              onChange={(e) => handleFieldChange('increment', Number(e.target.value))}
              className="flex-1 rounded border border-slate-300 px-2 py-1 text-[11px]"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="w-20 text-[11px] text-[var(--text-secondary)]">Prefix</label>
            <input
              type="text"
              value={config.prefix || ''}
              onChange={(e) => handleFieldChange('prefix', e.target.value)}
              className="flex-1 rounded border border-slate-300 px-2 py-1 text-[11px]"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="w-20 text-[11px] text-[var(--text-secondary)]">Suffix</label>
            <input
              type="text"
              value={config.suffix || ''}
              onChange={(e) => handleFieldChange('suffix', e.target.value)}
              className="flex-1 rounded border border-slate-300 px-2 py-1 text-[11px]"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="w-20 text-[11px] text-[var(--text-secondary)]">Padding</label>
            <input
              type="number"
              value={config.padding ?? 4}
              onChange={(e) => handleFieldChange('padding', Number(e.target.value))}
              className="flex-1 rounded border border-slate-300 px-2 py-1 text-[11px]"
              min={0}
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="w-20 text-[11px] text-[var(--text-secondary)]">Reset Type</label>
            <select
              value={config.resetType || 'never'}
              onChange={(e) => handleFieldChange('resetType', e.target.value)}
              className="flex-1 rounded border border-slate-300 px-1 py-1 text-[11px]"
            >
              <option value="never">Never</option>
              <option value="daily">Daily</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
              <option value="perTemplate">Per Template</option>
            </select>
          </div>
        </div>
      )

    case 'globalVariable':
      return (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <label className="w-20 text-[11px] text-[var(--text-secondary)]">Variable Key</label>
            <input
              type="text"
              value={config.variableKey || ''}
              onChange={(e) => handleFieldChange('variableKey', e.target.value)}
              className="flex-1 rounded border border-slate-300 px-2 py-1 text-[11px]"
              placeholder="Enter variable key"
            />
          </div>
        </div>
      )

    case 'formula':
      return (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <label className="w-20 text-[11px] text-[var(--text-secondary)]">Expression</label>
            <textarea
              value={config.expression || ''}
              onChange={(e) => handleFieldChange('expression', e.target.value)}
              className="flex-1 rounded border border-slate-300 px-2 py-1 text-[11px] font-mono"
              rows={3}
              placeholder="e.g. {{field1}} + '-' + {{field2}}"
            />
          </div>
        </div>
      )

    default:
      return null
  }
}

const TYPE_ICONS: Record<DataSourceType, string> = {
  static: 'S',
  csv: 'CSV',
  excel: 'XLS',
  sqlite: 'DB',
  postgresql: 'PG',
  mysql: 'MY',
  sqlserver: 'MS',
  json: '{ }',
  printTimeInput: '✏',
  counter: '#',
  globalVariable: 'V',
  formula: 'ƒ',
}

export default function DataSourcePanel({ dataSources, onChange, onMapField }: DataSourcePanelProps) {
  const { objects } = useDesignerStore()
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [newType, setNewType] = useState<DataSourceType>('static')
  const [newName, setNewName] = useState('')
  const [fieldMappings, setFieldMappings] = useState<Record<string, FieldMapping[]>>({})
  const [showAddForm, setShowAddForm] = useState(false)

  const handleAdd = () => {
    const ds: DataSourceConfig = {
      id: uuidv4(),
      name: newName || newType,
      type: newType,
      config: getEmptyConfig(newType),
      isDefault: dataSources.length === 0,
    }
    onChange([...dataSources, ds])
    setNewName('')
    setNewType('static')
    setShowAddForm(false)
    setEditingId(ds.id)
    setExpandedId(ds.id)
  }

  const handleDelete = (id: string) => {
    onChange(dataSources.filter((ds) => ds.id !== id))
    if (expandedId === id) setExpandedId(null)
    if (editingId === id) setEditingId(null)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleConfigChange = (id: string, config: Record<string, any>) => {
    onChange(dataSources.map((ds) => (ds.id === id ? { ...ds, config } : ds)))
  }

  const handleNameChange = (id: string, name: string) => {
    onChange(dataSources.map((ds) => (ds.id === id ? { ...ds, name } : ds)))
  }

  const handleSetDefault = (id: string) => {
    onChange(dataSources.map((ds) => ({ ...ds, isDefault: ds.id === id })))
  }

  const getFieldsForSource = (ds: DataSourceConfig): string[] => {
    switch (ds.type) {
      case 'static':
        return ['value']
      case 'csv':
      case 'excel':
        return ['row_number', ...(ds.config.hasHeader ? ['header_fields'] : [])]
      case 'sqlite':
      case 'postgresql':
      case 'mysql':
      case 'sqlserver':
        return ['query_fields']
      case 'json':
        return ['json_fields']
      case 'printTimeInput':
        return [ds.config.label || 'input']
      case 'counter':
        return ['counter_value']
      case 'globalVariable':
        return [ds.config.variableKey || 'variable']
      case 'formula':
        return ['formula_result']
      default:
        return []
    }
  }

  return (
    <div className="w-64 border-l border-[var(--border-color)] bg-white flex flex-col overflow-y-auto">
      <div className="flex h-8 items-center justify-between border-b border-[var(--border-color)] px-3">
        <span className="text-xs font-semibold text-[var(--text-secondary)]">Data Sources</span>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex h-5 w-5 items-center justify-center rounded text-sm text-[var(--color-primary)] hover:bg-blue-50 transition-colors"
          title="Add data source"
        >
          +
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {showAddForm && (
          <div className="border-b border-[var(--border-color)] p-3 bg-blue-50">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <label className="w-12 text-[11px] text-[var(--text-secondary)]">Name</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="flex-1 rounded border border-slate-300 px-2 py-1 text-[11px]"
                  placeholder="Data source name"
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="w-12 text-[11px] text-[var(--text-secondary)]">Type</label>
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value as DataSourceType)}
                  className="flex-1 rounded border border-slate-300 px-1 py-1 text-[11px]"
                >
                  {DATA_SOURCE_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  onClick={handleAdd}
                  className="flex-1 rounded bg-[var(--color-primary)] px-2 py-1 text-[11px] font-medium text-white hover:bg-[var(--color-primary-hover)] transition-colors"
                >
                  Add
                </button>
                <button
                  onClick={() => setShowAddForm(false)}
                  className="flex-1 rounded border border-slate-300 px-2 py-1 text-[11px] font-medium hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {dataSources.length === 0 && !showAddForm && (
          <div className="p-3 text-center text-[11px] text-[var(--text-secondary)]">
            No data sources. Click + to add one.
          </div>
        )}

        {dataSources.map((ds) => {
          const isExpanded = expandedId === ds.id
          const isEditing = editingId === ds.id
          const fields = getFieldsForSource(ds)

          return (
            <div key={ds.id} className="border-b border-[var(--border-color)]">
              <div
                className="flex cursor-pointer items-center gap-2 px-3 py-1.5 hover:bg-slate-50 transition-colors"
                onClick={() => setExpandedId(isExpanded ? null : ds.id)}
              >
                <span className="flex h-5 w-5 items-center justify-center rounded bg-slate-100 text-[10px] font-mono font-bold">
                  {TYPE_ICONS[ds.type]}
                </span>
                <span className="flex-1 truncate text-xs font-medium">{ds.name}</span>
                {ds.isDefault && (
                  <span className="rounded bg-green-100 px-1.5 text-[9px] font-medium text-green-700">Default</span>
                )}
                <span className="text-[10px] text-[var(--text-secondary)]">▼</span>
              </div>

              {isExpanded && (
                <div className="bg-slate-50 px-3 pb-3 pt-1">
                  {isEditing ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <label className="w-16 text-[11px] text-[var(--text-secondary)]">Name</label>
                        <input
                          type="text"
                          value={ds.name}
                          onChange={(e) => handleNameChange(ds.id, e.target.value)}
                          className="flex-1 rounded border border-slate-300 px-2 py-1 text-[11px]"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <label className="w-16 text-[11px] text-[var(--text-secondary)]">Type</label>
                        <span className="text-[11px] font-medium capitalize">
                          {DATA_SOURCE_TYPES.find((t) => t.value === ds.type)?.label || ds.type}
                        </span>
                      </div>
                      <DataSourceConfigFields
                        type={ds.type}
                        config={ds.config}
                        onChange={(config) => handleConfigChange(ds.id, config)}
                      />
                      <div className="flex gap-2 pt-1">
                        <button
                          onClick={() => setEditingId(null)}
                          className="flex-1 rounded bg-[var(--color-primary)] px-2 py-1 text-[11px] font-medium text-white hover:bg-[var(--color-primary-hover)] transition-colors"
                        >
                          Done
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-[var(--text-secondary)]">
                          {DATA_SOURCE_TYPES.find((t) => t.value === ds.type)?.label}
                        </span>
                        <div className="flex gap-1">
                          <button
                            onClick={(e) => { e.stopPropagation(); setEditingId(ds.id) }}
                            className="rounded px-1.5 py-0.5 text-[10px] text-blue-600 hover:bg-blue-100 transition-colors"
                          >
                            Edit
                          </button>
                          {!ds.isDefault && (
                            <button
                              onClick={(e) => { e.stopPropagation(); handleSetDefault(ds.id) }}
                              className="rounded px-1.5 py-0.5 text-[10px] text-green-600 hover:bg-green-100 transition-colors"
                            >
                              Set Default
                            </button>
                          )}
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDelete(ds.id) }}
                            className="rounded px-1.5 py-0.5 text-[10px] text-red-600 hover:bg-red-100 transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </div>

                      {fields.length > 0 && (
                        <div className="mt-2 rounded border border-[var(--border-color)] bg-white">
                          <div className="border-b border-[var(--border-color)] px-2 py-1">
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-secondary)]">Fields</span>
                          </div>
                          {fields.map((field) => (
                            <div
                              key={field}
                              className="flex items-center gap-1 border-b border-[var(--border-color)] px-2 py-1 last:border-b-0"
                              draggable
                            >
                              <span className="flex-1 truncate text-[11px]">{field}</span>
                              <select
                                className="w-20 rounded border border-slate-300 px-1 py-0.5 text-[10px]"
                                value={
                                  fieldMappings[ds.id]?.find((m) => m.fieldName === field)?.objectId || ''
                                }
                                onChange={(e) => {
                                  const objectId = e.target.value || null
                                  setFieldMappings((prev) => {
                                    const existing = prev[ds.id] || []
                                    const updated = existing.some((m) => m.fieldName === field)
                                      ? existing.map((m) => m.fieldName === field ? { ...m, objectId } : m)
                                      : [...existing, { fieldName: field, objectId }]
                                    return { ...prev, [ds.id]: updated }
                                  })
                                  if (onMapField && objectId) {
                                    onMapField(ds.id, field, objectId)
                                  }
                                }}
                              >
                                <option value="">Unmapped</option>
                                {objects.map((obj) => (
                                  <option key={obj.id} value={obj.id}>
                                    {obj.name}
                                  </option>
                                ))}
                              </select>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {dataSources.length > 0 && (
        <div className="border-t border-[var(--border-color)] px-3 py-2">
          <span className="text-[10px] text-[var(--text-secondary)]">
            {dataSources.length} data source{dataSources.length !== 1 ? 's' : ''}
          </span>
        </div>
      )}
    </div>
  )
}