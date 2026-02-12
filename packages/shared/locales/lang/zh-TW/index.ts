import common from './common'
import system from './system'

const rendererModules = import.meta.glob('./renderer/*.ts', { eager: true })

const renderer: Record<string, any> = {}

Object.keys(rendererModules).forEach((path) => {
  const segments = path.split('/')
  const filename = segments[segments.length - 1] || ''
  const key = filename.replace(/\.\w+$/, '')
  const mod = rendererModules[path] as any
  renderer[key] = mod?.default ?? mod
})

export default {
  lang: '繁體中文',
  common,
  system,
  ...renderer,
}
