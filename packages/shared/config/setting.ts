export enum PROXY_TYPE {
  CUSTOM = 'custom',
  DIRECT = 'direct',
  SYSTEM = 'system',
}
export type IProxyType = `${PROXY_TYPE}`

export enum AIGC_PROVIDER_TYPE {
  AMZON = 'amazon',
  ANTHROPIC = 'anthropic',
  AZURE = 'azure',
  GEMINI = 'gemini',
  OPENAI = 'openai',
}
export type IAigcProviderType = `${AIGC_PROVIDER_TYPE}`
