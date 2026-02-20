/**
 * 数据库迁移脚本
 */
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import { db, closeConnection } from './connection/index.js'

async function runMigrations() {
  console.log('Running migrations...')

  try {
    await migrate(db, { migrationsFolder: './drizzle' })
    console.log('Migrations completed successfully')
  } catch (error) {
    console.error('Migration failed:', error)
    process.exit(1)
  } finally {
    await closeConnection()
  }
}

runMigrations()
