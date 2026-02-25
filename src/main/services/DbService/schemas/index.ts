import type { ResultSet } from '@libsql/client'
import type { ExtractTablesWithRelations } from 'drizzle-orm'
import type { SQLiteTransaction } from 'drizzle-orm/sqlite-core'

import type { SettingModel } from './setting'
import { setting } from './setting'

export const schemas = {
  setting,
} as const

export const tableNames = Object.keys(schemas) as (keyof Schemas)[]

export type Schemas = typeof schemas

export type TableName = keyof Schemas

export interface Models {
  setting: SettingModel
}

export type AppTransaction<TMode extends 'async' | 'sync' = 'async'> = SQLiteTransaction<
  TMode,
  ResultSet,
  Schemas,
  ExtractTablesWithRelations<Schemas>
>

export type Transaction = AppTransaction<'async'>
