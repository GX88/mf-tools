import type { RecursiveRequired, Settings } from '#/global'
import { cloneDeep } from 'es-toolkit'
import settingsDefault from '@renderer/settings.default'
import { merge } from '@renderer/utils/object'

const globalSettings: Settings.all = {
  "menu": {
    "mode": "head",
    "style": "line",
    "subMenuCollapse": true,
    "subMenuAutoCollapse": true
  },
  "topbar": {
    "mode": "fixed"
  }
}

export default merge(globalSettings, cloneDeep(settingsDefault)) as RecursiveRequired<Settings.all>
