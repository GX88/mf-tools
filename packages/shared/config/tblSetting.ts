import type { IAigcProviderType } from '@shared/config/setting'
import type { ITheme } from '@shared/config/theme'
import type { ILang } from '@shared/locales'

export const settingList = [
  { key: 'version', value: '3.4.1' },
  { key: 'disclaimer', value: false },
  { key: 'theme', value: 'system' },
  { key: 'lang', value: 'system' },
  { key: 'timeout', value: 10000 },
  { key: 'bossKey', value: '' },
  { key: 'autoLaunch', value: false },
  { key: 'hardwareAcceleration', value: true },
  {
    key: 'ua',
    value:
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36',
  },
  { key: 'proxy', value: { type: 'system', url: '', bypass: '' } },
  { key: 'dns', value: '' },
  {
    key: 'cloud',
    value: {
      sync: false,
      type: 'webdav',
      url: 'https://dav.jianguoyun.com/dav/',
      username: '',
      password: '',
    },
  },
  { key: 'aigc', value: { type: 'openai', server: '', key: '', model: 'gpt-3.5-turbo' } },
  { key: 'zoom', value: 1 },
  { key: 'debug', value: false },
] as const

export const settingObj: ISetting = settingList.reduce(
  (acc, { key, value }) => ({ ...acc, [key]: value }),
  {} as ISetting,
)

export type ISettingKey = (typeof settingList)[number]['key']

export const settingKeys: ISettingKey[] = settingList.map(item => item.key)

export interface ISetting {
  version: string
  disclaimer: boolean
  theme: ITheme
  lang: ILang
  timeout: number
  defaultAnalyze: string
  defaultIptv: string
  defaultSite: string
  site: {
    searchMode: string
    filterMode: boolean
  }
  live: {
    ipMark: boolean
    thumbnail: boolean
    delay: boolean
    epg: string
    logo: string
  }
  bossKey: string
  autoLaunch: boolean
  hardwareAcceleration: boolean
  ua: string
  proxy: {
    type: string
    url: string
    bypass: string
  }
  dns: string
  barrage: {
    url: string
    id: string
    key: string
    support: string[]
    type: number
    text: number
    start: number
    color: number
  }
  cloud: {
    sync: boolean
    type: 'webdav' | 'icloud'
    url: string
    username: string
    password: string
  }
  aigc: {
    type: IAigcProviderType
    server: string
    key: string
    model: string
  }
  zoom: number
  debug: boolean
}

export type ISetupKey
  = | 'disclaimer'
    | 'theme'
    | 'lang'
    | 'bossKey'
    | 'barrage'
    | 'timeout'
    | 'debug'

export const setupKeys: ISetupKey[] = [
  'disclaimer',
  'theme',
  'lang',
  'bossKey',
  'barrage',
  'timeout',
  'debug',
]

export type ISetup = Pick<ISetting, ISetupKey>

export const setupList = settingList.filter(item => setupKeys.includes(item.key as ISetupKey))

export const setupObj = setupList.reduce(
  (acc, { key, value }) => ({ ...acc, [key]: value }),
  {} as ISetup,
)
