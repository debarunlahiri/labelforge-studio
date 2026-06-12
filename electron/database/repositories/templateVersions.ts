import { getDatabase } from '../db'
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
  const db = getDatabase()
  return db
    .prepare(
      'SELECT * FROM template_versions WHERE template_id = ? ORDER BY version_number DESC'
    )
    .all(templateId) as TemplateVersion[]
}

export function getTemplateVersionById(id: string): TemplateVersion | null {
  const db = getDatabase()
  const row = db.prepare('SELECT * FROM template_versions WHERE id = ?').get(id)
  return (row as TemplateVersion | undefined) || null
}

export function saveTemplateVersion(
  templateId: string,
  data: {
    template_json: string
    change_comment?: string
    created_by: string
  }
): TemplateVersion {
  const db = getDatabase()
  const id = uuidv4()

  const maxVersion = db
    .prepare(
      'SELECT MAX(version_number) as max_ver FROM template_versions WHERE template_id = ?'
    )
    .get(templateId) as { max_ver: number | null }

  const versionNumber = (maxVersion?.max_ver || 0) + 1

  db.prepare(
    `INSERT INTO template_versions (id, template_id, version_number, template_json, change_comment, status, created_by)
     VALUES (?, ?, ?, ?, ?, 'Draft', ?)`
  ).run(id, templateId, versionNumber, data.template_json, data.change_comment || null, data.created_by)

  db.prepare("UPDATE templates SET current_version_id = ?, updated_at = datetime('now') WHERE id = ?").run(
    id,
    templateId
  )

  return getTemplateVersionById(id)!
}

export function submitForApproval(id: string): TemplateVersion | null {
  const db = getDatabase()
  db.prepare("UPDATE template_versions SET status = 'Pending Approval' WHERE id = ?").run(id)
  return getTemplateVersionById(id)
}

export function approveVersion(id: string, approverId: string): TemplateVersion | null {
  const db = getDatabase()
  db.prepare(
    `UPDATE template_versions SET status = 'Approved', approved_by = ?, approved_at = datetime('now') WHERE id = ?`
  ).run(approverId, id)

  const version = getTemplateVersionById(id)
  if (version) {
    db.prepare("UPDATE templates SET status = 'Approved', current_version_id = ?, updated_at = datetime('now') WHERE id = ?").run(
      id,
      version.template_id
    )
  }

  return version
}

export function rejectVersion(id: string, reason?: string): TemplateVersion | null {
  const db = getDatabase()
  const comment = reason ? `Rejected: ${reason}` : 'Rejected'
  db.prepare(
    `UPDATE template_versions SET status = 'Rejected', change_comment = COALESCE(change_comment || ' | ' || ?, ?) WHERE id = ?`
  ).run(comment, comment, id)
  return getTemplateVersionById(id)
}