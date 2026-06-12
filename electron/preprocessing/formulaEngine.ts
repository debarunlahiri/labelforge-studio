export interface FormulaContext {
  record: Record<string, any>
  globals?: Record<string, string>
}

type Token =
  | { type: 'literal'; value: any }
  | { type: 'field'; name: string }
  | { type: 'operator'; op: string }
  | { type: 'function'; name: string; args: Token[] }
  | { type: 'conditional'; condition: Token[]; trueBranch: Token[]; falseBranch: Token[] }
  | { type: 'group'; tokens: Token[] }

function tokenize(formula: string): Token[] {
  const tokens: Token[] = []
  let pos = 0

  function skipWhitespace() {
    while (pos < formula.length && /\s/.test(formula[pos])) pos++
  }

  function readString(): string {
    const quote = formula[pos]
    pos++
    let str = ''
    while (pos < formula.length && formula[pos] !== quote) {
      if (formula[pos] === '\\' && pos + 1 < formula.length) {
        pos++
        str += formula[pos]
      } else {
        str += formula[pos]
      }
      pos++
    }
    if (pos < formula.length) pos++
    return str
  }

  function readField(): string {
    pos++
    let name = ''
    while (pos < formula.length && (formula[pos] === '_' || /[a-zA-Z0-9.]/.test(formula[pos]))) {
      name += formula[pos]
      pos++
    }
    return name
  }

  function readNumber(): string {
    let num = ''
    while (pos < formula.length && (/[0-9]/.test(formula[pos]) || formula[pos] === '.')) {
      num += formula[pos]
      pos++
    }
    return num
  }

  function readIdentifier(): string {
    let name = ''
    while (pos < formula.length && (formula[pos] === '_' || /[a-zA-Z0-9]/.test(formula[pos]))) {
      name += formula[pos]
      pos++
    }
    return name
  }

  while (pos < formula.length) {
    skipWhitespace()
    if (pos >= formula.length) break

    const ch = formula[pos]

    if (ch === '"' || ch === "'") {
      tokens.push({ type: 'literal', value: readString() })
    } else if (ch === '[') {
      pos++
      let name = ''
      while (pos < formula.length && formula[pos] !== ']') {
        name += formula[pos]
        pos++
      }
      if (pos < formula.length) pos++
      tokens.push({ type: 'field', name })
    } else if (ch === '{' && formula[pos + 1] === '{') {
      tokens.push({ type: 'field', name: readField() })
    } else if (/\d/.test(ch)) {
      tokens.push({ type: 'literal', value: parseFloat(readNumber()) })
    } else if (/[a-zA-Z_]/.test(ch)) {
      const name = readIdentifier()
      skipWhitespace()
      if (formula[pos] === '(') {
        pos++
        const args: Token[] = []
        if (formula[pos] !== ')') {
          const argTokens = readTokenListUntil(')', ',')
          args.push(...argTokens)
        }
        if (formula[pos] === ')') pos++
        tokens.push({ type: 'function', name: name.toLowerCase(), args })
      } else {
        tokens.push({ type: 'field', name })
      }
    } else if (ch === '(') {
      pos++
      const groupTokens: Token[] = []
      let depth = 1
      let start = pos
      while (pos < formula.length && depth > 0) {
        if (formula[pos] === '(') depth++
        else if (formula[pos] === ')') { depth--; if (depth === 0) break }
        pos++
      }
      const inner = formula.substring(start, pos)
      if (pos < formula.length) pos++
      const innerTokens = tokenize(inner)
      tokens.push({ type: 'group', tokens: innerTokens })
    } else if ('+-*/'.includes(ch)) {
      tokens.push({ type: 'operator', op: ch })
      pos++
    } else {
      pos++
    }
  }

  return tokens
}

function readTokenListUntil(endChar: string, separator: string): Token[] {
  return []
}

function evaluateTokens(tokens: Token[], context: FormulaContext): any {
  if (tokens.length === 0) return null

  if (tokens.length === 1) {
    return evaluateToken(tokens[0], context)
  }

  if (tokens.some(t => t.type === 'conditional')) {
    const condIdx = tokens.findIndex(t => t.type === 'conditional')
    const cond = tokens[condIdx] as Token & { type: 'conditional' }
    const condResult = evaluateTokens(cond.condition, context)
    if (condResult) {
      return evaluateTokens(cond.trueBranch, context)
    } else {
      return evaluateTokens(cond.falseBranch, context)
    }
  }

  const ops = ['+', '-', '*', '/']
  for (const op of ops) {
    for (let i = tokens.length - 1; i >= 0; i--) {
      const token = tokens[i]
      if (token.type === 'operator' && token.op === op) {
        const left = evaluateTokens(tokens.slice(0, i), context)
        const right = evaluateTokens(tokens.slice(i + 1), context)
        return arithmetic(left, right, op)
      }
    }
  }

  return evaluateToken(tokens[0], context)
}

function arithmetic(left: any, right: any, op: string): any {
  const l = Number(left)
  const r = Number(right)
  if (isNaN(l) || isNaN(r)) {
    if (op === '+') return String(left ?? '') + String(right ?? '')
    return null
  }
  switch (op) {
    case '+': return l + r
    case '-': return l - r
    case '*': return l * r
    case '/': return r !== 0 ? l / r : null
    default: return null
  }
}

function evaluateToken(token: Token, context: FormulaContext): any {
  switch (token.type) {
    case 'literal':
      return token.value
    case 'field':
      return resolveField(token.name, context)
    case 'operator':
      return null
    case 'function':
      return evaluateFunction(token.name, token.args, context)
    case 'group':
      return evaluateTokens(token.tokens, context)
    case 'conditional':
      return null
    default:
      return null
  }
}

function resolveField(name: string, context: FormulaContext): any {
  if (context.record && name in context.record) {
    return context.record[name]
  }
  if (context.globals && name in context.globals) {
    return context.globals[name]
  }
  return null
}

function evaluateFunction(name: string, args: Token[], context: FormulaContext): any {
  const ev = (i: number) => evaluateToken(args[i], context)

  switch (name) {
    case 'uppercase':
      return String(ev(0) ?? '').toUpperCase()
    case 'lowercase':
      return String(ev(0) ?? '').toLowerCase()
    case 'substring': {
      const str = String(ev(0) ?? '')
      const start = Number(ev(1)) || 0
      const end = args.length > 2 ? Number(ev(2)) : undefined
      return end !== undefined ? str.substring(start, end) : str.substring(start)
    }
    case 'replace': {
      const s = String(ev(0) ?? '')
      const search = String(ev(1) ?? '')
      const replacement = String(ev(2) ?? '')
      return s.split(search).join(replacement)
    }
    case 'trim':
      return String(ev(0) ?? '').trim()
    case 'length':
      return String(ev(0) ?? '').length
    case 'concat': {
      let result = ''
      for (let i = 0; i < args.length; i++) {
        result += String(ev(i) ?? '')
      }
      return result
    }
    case 'round': {
      const val = Number(ev(0))
      if (isNaN(val)) return null
      const decimals = args.length > 1 ? Number(ev(1)) : 0
      const factor = Math.pow(10, decimals)
      return Math.round(val * factor) / factor
    }
    case 'floor':
      return Math.floor(Number(ev(0)))
    case 'ceil':
      return Math.ceil(Number(ev(0)))
    case 'formatnumber': {
      const num = Number(ev(0))
      if (isNaN(num)) return ''
      const decimals = args.length > 1 ? Number(ev(1)) : 2
      return num.toFixed(decimals)
    }
    case 'abs':
      return Math.abs(Number(ev(0)))
    case 'formatdate': {
      const dateVal = ev(0)
      const date = new Date(dateVal)
      if (isNaN(date.getTime())) return ''
      const format = args.length > 1 ? String(ev(1)) : 'YYYY-MM-DD'
      return formatDate(date, format)
    }
    case 'now':
      return new Date().toISOString()
    case 'adddays': {
      const dateVal = ev(0)
      const days = Number(ev(1))
      const date = new Date(dateVal)
      if (isNaN(date.getTime())) return null
      date.setDate(date.getDate() + days)
      return date.toISOString()
    }
    case 'if': {
      const condition = ev(0)
      return condition ? ev(1) : (args.length > 2 ? ev(2) : null)
    }
    case 'isnull': {
      const val = ev(0)
      return val === null || val === undefined || val === ''
    }
    case 'coalesce': {
      for (let i = 0; i < args.length; i++) {
        const val = ev(i)
        if (val !== null && val !== undefined && val !== '') return val
      }
      return null
    }
    default:
      return null
  }
}

function formatDate(date: Date, format: string): string {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  const hours = date.getHours()
  const minutes = date.getMinutes()
  const seconds = date.getSeconds()

  let result = format
  result = result.replace('YYYY', String(year))
  result = result.replace('MM', String(month).padStart(2, '0'))
  result = result.replace('DD', String(day).padStart(2, '0'))
  result = result.replace('HH', String(hours).padStart(2, '0'))
  result = result.replace('mm', String(minutes).padStart(2, '0'))
  result = result.replace('ss', String(seconds).padStart(2, '0'))
  return result
}

export function evaluateFormula(formula: string, record: Record<string, any>, globals?: Record<string, string>): any {
  if (!formula || formula.trim().length === 0) return null

  const context: FormulaContext = { record, globals: globals || {} }

  const trimmed = formula.trim()

  const ifMatch = trimmed.match(/^if\s*\((.+),\s*(.+),\s*(.+)\)$/i)
  if (ifMatch) {
    const condition = evaluateTokens(tokenize(ifMatch[1]), context)
    if (condition) {
      return evaluateTokens(tokenize(ifMatch[2]), context)
    } else {
      const elsePart = ifMatch[3]
      if (elsePart.trim().length > 0) {
        return evaluateTokens(tokenize(elsePart), context)
      }
      return null
    }
  }

  const tokens = tokenize(trimmed)
  return evaluateTokens(tokens, context)
}

export function validateFormula(formula: string): { valid: boolean; error?: string } {
  if (!formula || formula.trim().length === 0) {
    return { valid: false, error: 'Formula cannot be empty' }
  }

  const openParens = (formula.match(/\(/g) || []).length
  const closeParens = (formula.match(/\)/g) || []).length
  if (openParens !== closeParens) {
    return { valid: false, error: 'Mismatched parentheses' }
  }

  const openBrackets = (formula.match(/\[/g) || []).length
  const closeBrackets = (formula.match(/\]/g) || []).length
  if (openBrackets !== closeBrackets) {
    return { valid: false, error: 'Mismatched brackets' }
  }

  try {
    tokenize(formula)
    return { valid: true }
  } catch (e: any) {
    return { valid: false, error: e.message }
  }
}

export function getFormulaDependencies(formula: string): string[] {
  const tokens = tokenize(formula)
  const fields: string[] = []

  function extractFromTokens(toks: Token[]): void {
    for (const t of toks) {
      if (t.type === 'field') {
        fields.push(t.name)
      } else if (t.type === 'function' && t.args) {
        extractFromTokens(t.args)
      } else if (t.type === 'group' && t.tokens) {
        extractFromTokens(t.tokens)
      }
    }
  }

  extractFromTokens(tokens)
  return [...new Set(fields)]
}