import { db, DB_VERSION } from './database'

export async function runMigrations() {
  const storedVersion = localStorage.getItem('knowledge_db_version') || localStorage.getItem('db_version') || '1'

  if (parseInt(storedVersion) < DB_VERSION) {
    localStorage.setItem('knowledge_db_version', String(DB_VERSION))
    localStorage.removeItem('db_version')
  }
}
