import fs from 'fs'
import path from 'path'
import Database from 'better-sqlite3'

export type DataSourceType =
  | 'static'
  | 'csv'
  | 'excel'
  | 'sqlite'
  | 'postgresql'
  | 'mysql'
  | 'sqlserver'
  | 'json'
  | 'xml'
  | 'print_time_input'
  | 'counter'
  | 'global_variable'
  | 'formula'

export interface DataSourceConfig {
  filePath?: string
  connectionString?: string
  host?: string
  port?: number
  database?: string
  username?: string
  password?: string
  query?: string
  tableName?: string
  delimiter?: string
  hasHeaders?: boolean
  encoding?: string
  staticValues?: string
  counterStart?: number
  counterStep?: number
  counterPrefix?: string
  counterSuffix?: string
  variableKey?: string
  formula?: string
}

export interface DataSource {
  id: string
  template_id: string
  name: string
  type: string
  config_json: string
  is_default: number
}

export function parseCsv(content: string, delimiter: string = ',', hasHeaders: boolean = true): Record<string, any>[] {
  const lines = content.split(/\r?\n/).filter(line => line.trim().length > 0)
  if (lines.length === 0) return []

  function parseLine(line: string, delim: string): string[] {
    const fields: string[] = []
    let current = ''
    let inQuotes = false

    for (let i = 0; i < line.length; i++) {
      const ch = line[i]
      if (inQuotes) {
        if (ch === '"') {
          if (i + 1 < line.length && line[i + 1] === '"') {
            current += '"'
            i++
          } else {
            inQuotes = false
          }
        } else {
          current += ch
        }
      } else {
        if (ch === '"') {
          inQuotes = true
        } else if (ch === delim) {
          fields.push(current.trim())
          current = ''
        } else {
          current += ch
        }
      }
    }
    fields.push(current.trim())
    return fields
  }

  if (hasHeaders) {
    const headers = parseLine(lines[0], delimiter)
    const records: Record<string, any>[] = []
    for (let i = 1; i < lines.length; i++) {
      const values = parseLine(lines[i], delimiter)
      const record: Record<string, any> = {}
      for (let j = 0; j < headers.length; j++) {
        record[headers[j]] = j < values.length ? values[j] : ''
      }
      records.push(record)
    }
    return records
  } else {
    const records: Record<string, any>[] = []
    for (let i = 0; i < lines.length; i++) {
      const values = parseLine(lines[i], delimiter)
      const record: Record<string, any> = {}
      for (let j = 0; j < values.length; j++) {
        record[`column_${j}`] = values[j]
      }
      records.push(record)
    }
    return records
  }
}

export function parseJson(content: string): Record<string, any>[] {
  const parsed = JSON.parse(content)
  if (Array.isArray(parsed)) return parsed
  if (typeof parsed === 'object' && parsed !== null) {
    const keys = Object.keys(parsed)
    const firstVal = parsed[keys[0]]
    if (Array.isArray(firstVal)) return firstVal
  }
  return [parsed]
}

export function fetchRecords(dataSource: DataSource, limit?: number, offset?: number): Record<string, any>[] {
  const config: DataSourceConfig = JSON.parse(dataSource.config_json)
  const dsType = dataSource.type as DataSourceType

  let records: Record<string, any>[]

  switch (dsType) {
    case 'csv':
      records = fetchCsv(config)
      break
    case 'json':
      records = fetchJson(config)
      break
    case 'sqlite':
      records = fetchSqlite(config)
      break
    case 'static':
      records = fetchStatic(config)
      break
    case 'counter':
      records = fetchCounter(config, limit ?? 1)
      break
    case 'global_variable':
      records = fetchGlobalVariable(config)
      break
    case 'formula':
      records = [{}]
      break
    case 'excel':
    case 'postgresql':
    case 'mysql':
    case 'sqlserver':
    case 'xml':
    case 'print_time_input':
      records = []
      break
    default:
      records = []
  }

  if (limit !== undefined || offset !== undefined) {
    const start = offset ?? 0
    const end = limit !== undefined ? start + limit : undefined
    records = records.slice(start, end)
  }

  return records
}

export function getFields(dataSource: DataSource): string[] {
  const config: DataSourceConfig = JSON.parse(dataSource.config_json)
  const dsType = dataSource.type as DataSourceType

  switch (dsType) {
    case 'csv': {
      if (!config.filePath) return []
      const content = fs.readFileSync(config.filePath, config.encoding || 'utf-8')
      const records = parseCsv(content, config.delimiter || ',', config.hasHeaders !== false)
      if (records.length === 0) return []
      return Object.keys(records[0])
    }
    case 'json': {
      if (!config.filePath) return []
      const content = fs.readFileSync(config.filePath, 'utf-8')
      const records = parseJson(content)
      if (records.length === 0) return []
      return Object.keys(records[0])
    }
    case 'sqlite': {
      const records = fetchSqlite(config)
      if (records.length === 0) return []
      return Object.keys(records[0])
    }
    case 'static': {
      const values = config.staticValues ? config.staticValues.split(',').map(v => v.trim()) : []
      return ['value', ...values.map((_, i) => `value_${i}`)]
    }
    case 'counter':
      return ['value']
    case 'global_variable':
      return ['value']
    case 'formula':
      return ['value']
    default:
      return []
  }
}

function fetchCsv(config: DataSourceConfig): Record<string, any>[] {
  if (!config.filePath) return []
  const content = fs.readFileSync(config.filePath, config.encoding || 'utf-8')
  return parseCsv(content, config.delimiter || ',', config.hasHeaders !== false)
}

function fetchJson(config: DataSourceConfig): Record<string, any>[] {
  if (!config.filePath) return []
  const content = fs.readFileSync(config.filePath, 'utf-8')
  return parseJson(content)
}

function fetchSqlite(config: DataSourceConfig): Record<string, any>[] {
  const dbPath = config.filePath || config.connectionString
  if (!dbPath) return []

  let db: Database.Database | null = null
  try {
    db = new Database(dbPath, { readonly: true })
    const query = config.query || (config.tableName ? `SELECT * FROM ${config.tableName}` : '')
    if (!query) return []
    return db.prepare(query).all() as Record<string, any>[]
  } catch {
    return []
  } finally {
    if (db) db.close()
  }
}

function fetchStatic(config: DataSourceConfig): Record<string, any>[] {
  if (!config.staticValues) return []
  const values = config.staticValues.split(',').map(v => v.trim())
  return values.map(v => ({ value: v }))
}

function fetchCounter(config: DataSourceConfig, count: number): Record<string, any>[] {
  const start = config.counterStart ?? 1
  const step = config.counterStep ?? 1
  const prefix = config.counterPrefix || ''
  const suffix = config.counterSuffix || ''
  const records: Record<string, any>[] = []
  for (let i = 0; i < count; i++) {
    const val = start + i * step
    records.push({ value: `${prefix}${String(val).padStart(String(count).length, '0')}${suffix}` })
  }
  return records
}

function fetchGlobalVariable(config: DataSourceConfig): Record<string, any>[] {
  if (!config.variableKey) return []
  return [{ value: `{{${config.variableKey}}}` }]
}

export function buildConnectionString(config: DataSourceConfig, type: DataSourceType): string {
  switch (type) {
    case 'postgresql':
      return `postgresql://${config.username || 'user'}:${config.password || ''}@${config.host || 'localhost'}:${config.port || 5432}/${config.database || 'labelforge'}`
    case 'mysql':
      return `mysql://${config.username || 'root'}:${config.password || ''}@${config.host || 'localhost'}:${config.port || 3306}/${config.database || 'labelforge'}`
    case 'sqlserver':
      return `mssql://${config.username || 'sa'}:${config.password || ''}@${config.host || 'localhost'}:${config.port || 1433}/${config.database || 'labelforge'}`
    default:
      return config.connectionString || ''
  }
}