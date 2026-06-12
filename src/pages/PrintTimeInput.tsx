import { useState } from 'react'

interface PrintTimeField {
  id: string
  label: string
  type: string
  required: boolean
  options?: string[]
  defaultValue?: string
}

interface PrintTimeInputProps {
  fields: PrintTimeField[]
  onSubmit: (values: Record<string, string>) => void
  onCancel: () => void
}

export default function PrintTimeInput({ fields, onSubmit, onCancel }: PrintTimeInputProps) {
  const [values, setValues] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {}
    fields.forEach((f) => {
      if (f.type === 'checkbox') {
        initial[f.id] = f.defaultValue === 'true' ? 'true' : 'false'
      } else {
        initial[f.id] = f.defaultValue ?? ''
      }
    })
    return initial
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleChange = (id: string, value: string) => {
    setValues((prev) => ({ ...prev, [id]: value }))
    setErrors((prev) => {
      const next = { ...prev }
      delete next[id]
      return next
    })
  }

  const handleCheckboxChange = (id: string, checked: boolean) => {
    setValues((prev) => ({ ...prev, [id]: checked ? 'true' : 'false' }))
    setErrors((prev) => {
      const next = { ...prev }
      delete next[id]
      return next
    })
  }

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}
    fields.forEach((f) => {
      if (f.required) {
        const val = values[f.id]
        if (!val || val.trim() === '') {
          newErrors[f.id] = `${f.label} is required`
        }
      }
    })
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (validate()) {
      onSubmit(values)
    }
  }

  const renderField = (field: PrintTimeField) => {
    switch (field.type) {
      case 'text':
        return (
          <input
            type="text"
            value={values[field.id] ?? ''}
            onChange={(e) => handleChange(field.id, e.target.value)}
            className="w-full rounded-lg border border-[var(--border-color)] px-3 py-2 text-sm focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
            placeholder={field.label}
          />
        )
      case 'number':
        return (
          <input
            type="number"
            value={values[field.id] ?? ''}
            onChange={(e) => handleChange(field.id, e.target.value)}
            className="w-full rounded-lg border border-[var(--border-color)] px-3 py-2 text-sm focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
            placeholder={field.label}
          />
        )
      case 'date':
        return (
          <input
            type="date"
            value={values[field.id] ?? ''}
            onChange={(e) => handleChange(field.id, e.target.value)}
            className="w-full rounded-lg border border-[var(--border-color)] px-3 py-2 text-sm focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
          />
        )
      case 'dropdown':
        return (
          <select
            value={values[field.id] ?? ''}
            onChange={(e) => handleChange(field.id, e.target.value)}
            className="w-full rounded-lg border border-[var(--border-color)] px-3 py-2 text-sm focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
          >
            <option value="">Select {field.label}...</option>
            {field.options?.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        )
      case 'checkbox':
        return (
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={values[field.id] === 'true'}
              onChange={(e) => handleCheckboxChange(field.id, e.target.checked)}
              className="rounded border-slate-300 text-[var(--color-primary)] focus:ring-[var(--color-primary)]"
            />
            <span className="text-sm text-[var(--text-secondary)]">{field.label}</span>
          </label>
        )
      default:
        return (
          <input
            type="text"
            value={values[field.id] ?? ''}
            onChange={(e) => handleChange(field.id, e.target.value)}
            className="w-full rounded-lg border border-[var(--border-color)] px-3 py-2 text-sm focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
          />
        )
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {fields.map((field) => (
        <div key={field.id}>
          {field.type !== 'checkbox' && (
            <label className="mb-1 block text-sm font-medium text-[var(--text-primary)]">
              {field.label}
              {field.required && <span className="ml-1 text-red-500">*</span>}
            </label>
          )}
          {renderField(field)}
          {errors[field.id] && (
            <p className="mt-1 text-xs text-red-500">{errors[field.id]}</p>
          )}
        </div>
      ))}

      <div className="flex justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-slate-300 px-6 py-2 text-sm font-medium hover:bg-slate-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="rounded-lg bg-[var(--color-primary)] px-6 py-2 text-sm font-medium text-white hover:bg-[var(--color-primary-hover)] transition-colors"
        >
          Submit
        </button>
      </div>
    </form>
  )
}