import { useCallback, useState } from 'react'
import ConfirmDialog from '../components/ConfirmDialog'

type ConfirmOptions = {
  title?: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  danger?: boolean
}

export function useConfirm() {
  const [request, setRequest] = useState<(ConfirmOptions & { resolve: (value: boolean) => void }) | null>(null)
  const confirm = useCallback((options: ConfirmOptions) => new Promise<boolean>((resolve) => setRequest({ ...options, resolve })), [])
  const dialog = (
    <ConfirmDialog
      open={Boolean(request)}
      title={request?.title}
      message={request?.message || ''}
      confirmLabel={request?.confirmLabel}
      cancelLabel={request?.cancelLabel}
      danger={request?.danger}
      onConfirm={() => {
        request?.resolve(true)
        setRequest(null)
      }}
      onCancel={() => {
        request?.resolve(false)
        setRequest(null)
      }}
    />
  )
  return { confirm, dialog }
}
