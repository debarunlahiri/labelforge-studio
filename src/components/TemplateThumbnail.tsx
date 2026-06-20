import { useEffect, useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faRulerCombined } from '@fortawesome/free-solid-svg-icons'
import type { LabelObject, Template, TemplateVersion } from '../types'
import { renderToPNG } from '../utils/labelRenderer'

type TemplateThumbnailProps = {
  template: Template
}

export default function TemplateThumbnail({ template }: TemplateThumbnailProps) {
  const [thumbnail, setThumbnail] = useState<string | null>(null)
  const [hasSavedDesign, setHasSavedDesign] = useState(false)

  useEffect(() => {
    let active = true

    const loadThumbnail = async () => {
      try {
        const versions: TemplateVersion[] = await window.electronAPI?.templateVersions.list(template.id) || []
        const selectedVersion =
          versions.find((version) => version.id === template.current_version_id) ||
          [...versions].sort((a, b) => b.version_number - a.version_number)[0]

        if (!selectedVersion) return

        const canvas = JSON.parse(selectedVersion.template_json || '{}')
        const objects = Array.isArray(canvas.objects) ? canvas.objects as LabelObject[] : []
        const dataUrl = await renderToPNG(
          objects,
          template.label_width,
          template.label_height,
          template.dpi,
          template.unit,
        )

        if (active) {
          setThumbnail(dataUrl)
          setHasSavedDesign(true)
        }
      } catch {
        if (active) {
          setThumbnail(null)
          setHasSavedDesign(false)
        }
      }
    }

    void loadThumbnail()
    return () => {
      active = false
    }
  }, [
    template.current_version_id,
    template.dpi,
    template.id,
    template.label_height,
    template.label_width,
    template.unit,
    template.updated_at,
  ])

  return (
    <div className="flex h-52 items-center justify-center overflow-hidden border-b border-slate-200 bg-gradient-to-br from-slate-50 to-blue-50/60 p-5">
      <div
        className="flex max-h-full max-w-full items-center justify-center overflow-hidden border border-slate-300 bg-white shadow-md"
        style={{
          aspectRatio: `${Math.max(template.label_width, 1)} / ${Math.max(template.label_height, 1)}`,
          width: template.label_width >= template.label_height ? '70%' : 'auto',
          height: template.label_height > template.label_width ? '90%' : 'auto',
          minWidth: 64,
          minHeight: 40,
        }}
      >
        {thumbnail ? (
          <img
            src={thumbnail}
            alt={`Latest saved design for ${template.name}`}
            className="h-full w-full object-contain"
          />
        ) : (
          <div className="flex flex-col items-center gap-2 text-slate-300">
            <FontAwesomeIcon icon={faRulerCombined} />
            <span className="text-[10px] font-medium text-slate-400">
              {hasSavedDesign ? 'Preview unavailable' : 'No saved design'}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
