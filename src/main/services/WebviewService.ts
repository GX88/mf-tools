import { appLocale } from '@main/services/AppLocale';
import { configManager } from '@main/services/ConfigManager';
import { generateUserAgent } from '@main/utils/systeminfo';
import { session } from 'electron';

/**
 * 初始化 webview 专用 Session 的 User-Agent 与请求头
 *
 * 主要行为：
 * - 从 'persist:webview' 分区获取独立的 Session，避免与默认 Session 冲突
 * - 先使用 generateUserAgent() 生成一份基础 UA 并设置到 Session 上
 * - 在 onBeforeSendHeaders 中：
 *   - 使用 ConfigManager 中的 ua 覆盖 User-Agent
 *   - 根据 AppLocale 的 defaultLang 设置 Accept-Language
 *
 * 说明：
 * - 该逻辑用于统一 webview 中所有请求的 UA / 语言头，方便伪装浏览器环境或做区域适配
 */
export function initSessionUserAgent() {
  const wvSession = session.fromPartition('persist:webview');
  // const originUA = wvSession.getUserAgent();
  const defaultUA = generateUserAgent();

  wvSession.setUserAgent(defaultUA);
  wvSession.webRequest.onBeforeSendHeaders((details, cb) => {
    const ua = configManager.ua;
    const language = appLocale.defaultLang();

    const headers = {
      ...details.requestHeaders,
      'User-Agent': ua,
      'Accept-Language': `${language}, en;q=0.9, *;q=0.5`,
    };
    cb({ requestHeaders: headers });
  });
}
