import type { IStoreKey } from '@main/services/ConfigManager'

import type { ISetting, ISettingKey } from '@shared/config/tblSetting'
import type { IClient, IConfig, IMigrations, IOrm, ITableName } from '@shared/types/db'

import type { FSWatcher } from 'chokidar'
import { join } from 'node:path'
import { createClient } from '@libsql/client'
import { loggerService } from '@logger'
import { configManager, STORE_KEYS } from '@main/services/ConfigManager'
import { ICloudStorage, WebdavStorage } from '@main/services/StorageService'

import { fileDelete } from '@main/utils/file'
import { APP_DATABASE_PATH } from '@main/utils/path'
import { LOG_MODULE } from '@shared/config/logger'
import { isArrayEmpty, isObjectEmpty } from '@shared/modules/validate'

import chokidar from 'chokidar'
import { eq } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/libsql'
import semver from 'semver'

import operater from './crud'
import { initMigrate, latestVersion, updateMigrate } from './migrations'
import { schemas, tableNames } from './schemas'

const logger = loggerService.withContext(LOG_MODULE.DATABASE)

export class DbService {
  private static instance: DbService | null = null
  private dbURI: string = ''
  private client: IClient | null = null
  private orm: IOrm | null = null
  private watcher: FSWatcher | null = null
  private subscribers: Map<string, Array<(newValue: any) => void>> = new Map()

  private constructor() {
    this.dbURI = `file:${join(APP_DATABASE_PATH, 'data.db')}`
  }

  public static getInstance(): DbService {
    if (!DbService.instance) {
      DbService.instance = new DbService()
    }
    return DbService.instance
  }

  public static reload(): DbService {
    if (DbService.instance) {
      DbService.instance.close()
    }
    DbService.instance = new DbService()
    return DbService.instance
  }

  /**
   * Connect to database
   */
  private conn(): void {
    const DB_CONFIG: IConfig = {
      url: this.dbURI,
    }

    if (!this.client) { this.client = createClient(DB_CONFIG) }
    if (!this.orm) { this.orm = drizzle({ client: this.client, schema: schemas }) }
  }

  public async cloudBackup(
    type: ISetting['cloud']['type'],
    options: Omit<ISetting['cloud'], 'type' | 'sync'>,
  ): Promise<boolean> {
    try {
      const { url, username, password } = options || {}
      const content = await this.db.all()

      if (type === 'webdav') {
        const webdav = new WebdavStorage()
        await webdav.initClient({ url, username, password })
        await webdav.putFileContents('config.json', JSON.stringify(content))
      }
      else if (type === 'icloud') {
        const icloud = new ICloudStorage()
        await icloud.putFileContents('config.json', JSON.stringify(content))
      }
      return true
    }
    catch {
      return false
    }
  }

  public async cloudResume(
    type: ISetting['cloud']['type'],
    options: Omit<ISetting['cloud'], 'type' | 'sync'>,
  ): Promise<boolean> {
    try {
      const { url, username, password } = options || {}

      if (type === 'webdav') {
        const webdav = new WebdavStorage()
        await webdav.initClient({ url, username, password })
        const text = await webdav.getFileContents('config.json')
        const content = JSON.parse(text as string)
        await this.db.init(content)
      }
      else if (type === 'icloud') {
        const icloud = new ICloudStorage()
        const text = await icloud.getFileContents('config.json')
        const content = JSON.parse(text as string)
        await this.db.init(content)
      }
      return true
    }
    catch {
      return false
    }
  }

  private startWatcher(): void {
    const path = this.dbURI.replace('file:', '')

    this.watcher = chokidar.watch(path, {
      awaitWriteFinish: {
        stabilityThreshold: 500,
      },
    })

    this.watcher.on('change', async () => {
      try {
        const cloudConf = await this.setting.getValue('cloud')
        const { sync = false, type, ...options } = cloudConf || {}

        if (sync) {
          await this.cloudBackup(type, options)
        }
      }
      catch (error) {
        logger.error('Failed to cloud sync:', error as Error)
      }

      try {
        this.dbSyncStore()
      }
      catch (error) {
        logger.error('Failed to local sync:', error as Error)
      }
    })
  }

  private async stopWatcher(): Promise<void> {
    if (this.watcher) {
      await this.watcher.close()
    }
    this.watcher = null
  }

  /**
   * Close database connection
   */
  public async close() {
    if (this.client) {
      this.client.close()
      this.client = null
      this.orm = null
    }
    if (this.watcher) {
      await this.stopWatcher()
    }
  }

  /**
   * Get current database version
   * @returns string
   */
  private async getDbVersion(): Promise<string> {
    if (!this.client || !this.orm) {
      return '0.0.0'
    }

    try {
      const dbRes = (await this.setting.getValue('version')) || '0.0.0'
      const version = semver.valid(dbRes) || '0.0.0'
      return version
    }
    catch {
      return '0.0.0'
    }
  }

  /**
   * Migrate database to the latest version
   */
  public async migrate(): Promise<void> {
    if (!this.client || !this.orm) {
      return
    }

    const dbVersion = await this.getDbVersion()
    logger.info(`Current version: ${dbVersion}`)

    if (semver.gte(dbVersion, latestVersion)) { return }

    const migrationList: IMigrations
      = dbVersion === '0.0.0'
        ? initMigrate
          ? [initMigrate]
          : []
        : updateMigrate.filter(m => semver.gt(m.version, dbVersion))

    if (migrationList.length === 0) { return }

    for (const { version, migrate } of migrationList) {
      try {
        await migrate(this.orm, schemas)
        await this.orm
          .update(schemas.setting)
          .set({ value: { data: dbVersion === '0.0.0' ? latestVersion : version } })
          .where(eq(schemas.setting.key, 'version'))

        logger.info(`Migrate to ${version} success`)
      }
      catch (error) {
        if (dbVersion === '0.0.0') {
          await fileDelete(this.dbURI)
        }
        throw new Error(
          `Migrate to ${version} failed: ${error instanceof Error ? error.message : error}`,
        )
      }
    }
  }

  /**
   * Sync database to config manager
   */
  private async dbSyncStore(): Promise<void> {
    const config = await this.setting.all()

    STORE_KEYS.forEach((key) => {
      if (config[key] !== undefined) {
        configManager.set(key as IStoreKey, config[key] as any)
      }
    })
  }

  /**
   * Initialize the database connection and create tables
   */
  public async init(): Promise<void> {
    try {
      this.conn()
      await this.migrate()
      await this.dbSyncStore()
      this.startWatcher()

      logger.info('Initialized successfully')
    }
    catch (error) {
      logger.error('Failed to initialize database:', error as Error)
      throw new Error(
        `Database initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      )
    }
  }

  public subscribe<T>(key: string, callback: (newValue: T) => void) {
    if (!this.subscribers.has(key)) {
      this.subscribers.set(key, [])
    }
    this.subscribers.get(key)!.push(callback)
  }

  public unsubscribe<T>(key: string, callback: (newValue: T) => void) {
    const subscribers = this.subscribers.get(key)
    if (subscribers) {
      this.subscribers.set(
        key,
        subscribers.filter(subscriber => subscriber !== callback),
      )
    }
  }

  private notifySubscribers<T>(key: string, newValue: T) {
    const subscribers = this.subscribers.get(key)
    if (subscribers) {
      subscribers.forEach(subscriber => subscriber(newValue))
    }
  }

  public get tableNames() {
    return tableNames
  }

  public get db() {
    const TABLE_OPERATIONS = {
      setting: this.setting,
    }

    return {
      all: async (tableNames: ITableName[] = []): Promise<Partial<Record<ITableName, any>>> => {
        if (isArrayEmpty(tableNames) || isArrayEmpty(tableNames.filter(Boolean))) {
          tableNames = Object.keys(TABLE_OPERATIONS) as ITableName[]
        }

        const results = await Promise.all(tableNames.map(name => TABLE_OPERATIONS[name].all()))

        return Object.fromEntries(tableNames.map((name, i) => [name, results[i]]))
      },

      init: async (
        doc: Partial<Record<ITableName, any>>,
      ): Promise<Partial<Record<ITableName, any>>> => {
        const tableNames = Object.keys(doc).filter(name =>
          name in TABLE_OPERATIONS && name === 'setting'
            ? !isObjectEmpty(doc[name])
            : !isArrayEmpty(doc[name]),
        ) as ITableName[]
        const results = await Promise.all(
          tableNames.map(name => TABLE_OPERATIONS[name].set(doc[name])),
        )
        return Object.fromEntries(tableNames.map((name, i) => [name, results[i]]))
      },

      clear: async (tableNames: ITableName[] = []): Promise<Partial<Record<ITableName, any>>> => {
        if (isArrayEmpty(tableNames)) {
          tableNames = Object.keys(TABLE_OPERATIONS) as ITableName[]
        }

        const results = await Promise.all(tableNames.map(name => TABLE_OPERATIONS[name].clear()))

        return Object.fromEntries(tableNames.map((name, i) => [name, results[i]]))
      },
    }
  }

  public get setting() {
    return {
      all: () => operater.setting.all(this.orm!, schemas),
      get: (key: ISettingKey) => operater.setting.get(this.orm!, schemas, key),
      getValue: async (key: ISettingKey) => {
        const result = await operater.setting.get(this.orm!, schemas, key)
        return result?.value?.data ?? ''
      },
      add: async (doc: { key: ISettingKey, value: any }) => {
        const result = await operater.setting.add(this.orm!, schemas, doc)
        this.notifySubscribers(`setting:${doc.key}`, doc.value)
        return result
      },
      update: async (doc: { key: ISettingKey, value: any }) => {
        const result = await operater.setting.update(this.orm!, schemas, doc)
        this.notifySubscribers(`setting:${doc.key}`, doc.value)
        return result
      },
      remove: async (keys: ISettingKey[]) => {
        const result = await operater.setting.remove(this.orm!, schemas, keys)
        keys.forEach((key) => {
          this.notifySubscribers(`setting:${key}`, null)
        })
        return result
      },
      set: async (doc: Array<{ key: ISettingKey, value: any }>) => {
        const result = await operater.setting.set(this.orm!, schemas, doc)
        Object.entries(doc).forEach(([key, value]) => {
          this.notifySubscribers(`setting:${key}`, value)
        })
        return result
      },
      clear: async () => {
        const result = await operater.setting.clear(this.orm!, schemas)
        this.notifySubscribers('setting:*', null)
        return result
      },
    }
  }
}

export const dbService = DbService.getInstance()
