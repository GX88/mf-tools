import { configManager } from '@main/services/ConfigManager'
import { generateUserAgent } from '@main/utils/systeminfo'
import { isPositiveFiniteNumber, isUndefined } from '@shared/modules/validate'
import { machineIdSync } from 'node-machine-id'

/**
 * Get timeout value
 * Priority: Current > Option > Database > Default
 * @param timeout Current timeout(ms)
 * @param optionTimeout Option timeout(ms)
 * @returns Timeout(ms)
 */
export const getTimeout = (timeout?: number, optionTimeout?: number): number => {
  const MAX_TIMEOUT = 60 * 1000
  const MIN_TIMEOUT = 0
  const DEFAULT_TIMEOUT = 10 * 1000

  const storeTimeout = Number.parseInt(String(configManager.timeout))

  const isVisable = (val?: number): boolean => {
    if (isPositiveFiniteNumber(val) && val! >= MIN_TIMEOUT && val! <= MAX_TIMEOUT) {
      return true
    }
    return false
  }

  if (isVisable(timeout)) return timeout as number
  if (isVisable(optionTimeout)) return optionTimeout as number
  if (isVisable(storeTimeout)) return storeTimeout as number

  return DEFAULT_TIMEOUT
}

/**
 * Get user-agent value
 * Priority: Current > Option > Database > Default
 * @param ua Current user-agent
 * @param optionUa Option user-agent
 * @returns User-agent
 */
export const getUserAgent = (ua?: string, optionUa?: string): string => {
  const DEFAULT_UA = generateUserAgent()

  if (!isUndefined(ua)) return ua
  if (!isUndefined(optionUa)) return optionUa
  if (!isUndefined(configManager.ua)) return configManager.ua

  return DEFAULT_UA
}

/**
 * 获取设备唯一标识 ID
 */
export const getDeviceId = (time: string) => {
  const timestamp = time // 时间戳
  const encryptionKey = 'your_secret_key_here' // 加密密钥
  // 获取设备的mac地址
  const macAddress = machineIdSync(true)
  const deviceId = md5(`${timestamp}${macAddress}${encryptionKey}`)
  console.log('deviceId', macAddress)

  return deviceId
}

/**
 * MD5 加密
 */
export const md5 = (str: string) => {
  const crypto = require('crypto')
  return crypto.createHash('md5').update(str).digest('hex')
}
