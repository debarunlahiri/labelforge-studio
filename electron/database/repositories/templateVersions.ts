import { query, queryOne, run } from '../dbHelpers'
import { v4 as uuidv4 } from 'uuid'

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

export function listTemplateVersions(templateId: string): TemplateVersion[] {
  return query('SELECT * FROM template_versions WHERE template_id = ? ORDER BY version_number DESC', [templateId]) as TemplateVersion[]
}

export function getTemplateVersionById(id: string): TemplateVersion | null {
  return queryOne('SELECT * FROM template_versions WHERE id = ?', [id]) as TemplateVersion | null
}

export function saveTemplateVersion(
  templateId: string,
  data: {
    template_json: string
    change_comment?: string
    created_by: string
  }
): TemplateVersion {
  const id = uuidv4()

  const maxResult = queryOne(
    'SELECT MAX(version_number) as max_ver FROM template_versions WHERE template_id = ?',
    [templateId]
  )
  const versionNumber = ((maxResult?.max_ver as number) || 0) + 1

  run(
    'INSERT INTO template_versions (id, template_id, version_number, template_json, change_comment, status, created_by) VALUES (?, ?, ?, ?, ?, \'Draft\', ?)',
    [id, templateId, versionNumber, data.template_json, data.change_comment || null, data.created_by]
  )

  run("UPDATE templates SET current_version_id = ?, updated_at = datetime('now') WHERE id = ?", [id, templateId])

  return getTemplateVersionById(id)!
}

export function submitForApproval(id: string): TemplateVersion | null {
  run("UPDATE template_versions SET status = 'Pending Approval' WHERE id = ?", [id])
  return getTemplateVersionById(id)
}

export function approveVersion(id: string, approverId: string): TemplateVersion | null {
  run(
    "UPDATE template_versions SET status = 'Approved', approved_by = ?, approved_at = datetime('now') WHERE id = ?",
    [approverId, id]
  )

  const version = getTemplateVersionById(id)
  if (version) {
    run("UPDATE templates SET status = 'Approved', current_version_id = ?, updated_at = datetime('now') WHERE id = ?", [id, version.template_id])
  }

  return version
}

export function rejectVersion(id: string, reason?: string): TemplateVersion | null {
  const comment = reason ? `Rejected: ${reason}` : 'Rejected'
  run(
    "UPDATE template_versions SET status = 'Rejected', change_comment = COALESCE(change_comment || ' | ' || ?, ?) WHERE id = ?",
    [comment, comment, id]
  )
  return getTemplateVersionById(id)
}