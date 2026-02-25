import type { IOrm, ISchemas } from '@shared/types/db'
import { settingList as tblSetting } from '@shared/config/tblSetting'
import { sql } from 'drizzle-orm'

async function migrate(orm: IOrm, schemas: ISchemas): Promise<void> {
  // Create tables if not exists
  await orm.run(sql`
    CREATE TABLE IF NOT EXISTS tbl_setting (
      id        TEXT PRIMARY KEY,
      key       TEXT NOT NULL UNIQUE,
      value     TEXT,                        -- JSON
      createdAt INTEGER DEFAULT (strftime('%s', 'now') * 1000),
      updatedAt INTEGER DEFAULT (strftime('%s', 'now') * 1000)
    );
  `)

  await orm.run(sql`CREATE INDEX IF NOT EXISTS idx_setting_key ON tbl_setting(key);`)

  // tbl_setting insert default values
  if ((await orm.$count(schemas.setting)) === 0) {
    for (const item of tblSetting) {
      await orm.insert(schemas.setting).values({ key: item.key, value: { data: item.value } })
    }
  }
}

export default migrate
