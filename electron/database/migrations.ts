import type { Database as SqlJsDatabase } from 'sql.js'

const MIGRATIONS: { version: number; sql: string }[] = [
  {
    version: 1,
    sql: `
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        full_name TEXT,
        email TEXT,
        is_active INTEGER NOT NULL DEFAULT 1,
        last_login_at TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS roles (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        description TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS permissions (
        id TEXT PRIMARY KEY,
        code TEXT NOT NULL UNIQUE,
        description TEXT
      );

      CREATE TABLE IF NOT EXISTS user_roles (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        role_id TEXT NOT NULL,
        assigned_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (role_id) REFERENCES roles(id),
        UNIQUE(user_id, role_id)
      );

      CREATE TABLE IF NOT EXISTS role_permissions (
        id TEXT PRIMARY KEY,
        role_id TEXT NOT NULL,
        permission_id TEXT NOT NULL,
        granted_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (role_id) REFERENCES roles(id),
        FOREIGN KEY (permission_id) REFERENCES permissions(id),
        UNIQUE(role_id, permission_id)
      );

      CREATE TABLE IF NOT EXISTS templates (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        label_width REAL NOT NULL,
        label_height REAL NOT NULL,
        unit TEXT NOT NULL DEFAULT 'mm',
        dpi INTEGER NOT NULL DEFAULT 300,
        printer_type TEXT,
        page_orientation TEXT DEFAULT 'portrait',
        rows INTEGER DEFAULT 1,
        columns INTEGER DEFAULT 1,
        margin_top REAL DEFAULT 0,
        margin_bottom REAL DEFAULT 0,
        margin_left REAL DEFAULT 0,
        margin_right REAL DEFAULT 0,
        gap_horizontal REAL DEFAULT 0,
        gap_vertical REAL DEFAULT 0,
        current_version_id TEXT,
        status TEXT NOT NULL DEFAULT 'Draft',
        tags TEXT,
        created_by TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (created_by) REFERENCES users(id)
      );

      CREATE TABLE IF NOT EXISTS template_versions (
        id TEXT PRIMARY KEY,
        template_id TEXT NOT NULL,
        version_number INTEGER NOT NULL,
        template_json TEXT NOT NULL,
        change_comment TEXT,
        status TEXT NOT NULL DEFAULT 'Draft',
        created_by TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        approved_by TEXT,
        approved_at TEXT,
        FOREIGN KEY (template_id) REFERENCES templates(id),
        FOREIGN KEY (created_by) REFERENCES users(id),
        FOREIGN KEY (approved_by) REFERENCES users(id)
      );

      CREATE TABLE IF NOT EXISTS template_data_sources (
        id TEXT PRIMARY KEY,
        template_id TEXT NOT NULL,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        config_json TEXT NOT NULL,
        is_default INTEGER DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (template_id) REFERENCES templates(id)
      );

      CREATE TABLE IF NOT EXISTS printers (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        printer_type TEXT,
        connection_type TEXT,
        ip_address TEXT,
        port INTEGER,
        machine_name TEXT,
        driver_name TEXT,
        dpi INTEGER,
        status TEXT DEFAULT 'available',
        is_active INTEGER NOT NULL DEFAULT 1,
        last_seen TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS print_jobs (
        id TEXT PRIMARY KEY,
        template_id TEXT NOT NULL,
        template_version_id TEXT NOT NULL,
        printer_id TEXT NOT NULL,
        requested_by TEXT,
        copies INTEGER NOT NULL DEFAULT 1,
        payload_json TEXT,
        status TEXT NOT NULL DEFAULT 'Pending',
        error_message TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        started_at TEXT,
        completed_at TEXT,
        FOREIGN KEY (template_id) REFERENCES templates(id),
        FOREIGN KEY (requested_by) REFERENCES users(id),
        FOREIGN KEY (printer_id) REFERENCES printers(id)
      );

      CREATE TABLE IF NOT EXISTS print_job_logs (
        id TEXT PRIMARY KEY,
        print_job_id TEXT NOT NULL,
        message TEXT NOT NULL,
        status TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (print_job_id) REFERENCES print_jobs(id)
      );

      CREATE TABLE IF NOT EXISTS global_variables (
        id TEXT PRIMARY KEY,
        variable_key TEXT NOT NULL UNIQUE,
        variable_value TEXT,
        data_type TEXT DEFAULT 'string',
        description TEXT,
        is_active INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS audit_logs (
        id TEXT PRIMARY KEY,
        timestamp TEXT NOT NULL DEFAULT (datetime('now')),
        user_id TEXT,
        username TEXT,
        action TEXT NOT NULL,
        module TEXT,
        entity_type TEXT,
        entity_id TEXT,
        old_value TEXT,
        new_value TEXT,
        ip_address TEXT,
        machine_name TEXT,
        status TEXT,
        error_message TEXT
      );

      CREATE TABLE IF NOT EXISTS system_settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at TEXT DEFAULT (datetime('now'))
      );
    `,
  },
]

export function runMigrations(db: SqlJsDatabase): void {
  db.run(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version INTEGER PRIMARY KEY,
      applied_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `)

  const results = db.exec('SELECT version FROM schema_migrations ORDER BY version')
  const applied: number[] = []
  if (results.length > 0 && results[0].values) {
    for (const row of results[0].values) {
      applied.push(row[0] as number)
    }
  }

  for (const migration of MIGRATIONS) {
    if (!applied.includes(migration.version)) {
      db.run(migration.sql)
      db.run(`INSERT INTO schema_migrations (version) VALUES (${migration.version})`)
    }
  }
}