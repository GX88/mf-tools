import { APP_DATABASE_PATH } from '@main/utils/path';
import { generateUserAgent } from '@main/utils/systeminfo';
import { PROXY_TYPE } from '@shared/config/setting';
import type { ITheme } from '@shared/config/theme';
import type { ILang } from '@shared/locales';
import type { ProxyConfig } from 'electron';
import Store from 'electron-store';

/**
 * 应用配置存储键枚举
 *
 * - 统一管理所有可持久化配置项的 key，避免硬编码字符串
 * - 所有键最终会存储在 electron-store 对应的 JSON 文件中
 */
export enum IStore {
  THEME = 'theme',
  ZOOM = 'zoom',
  LANG = 'lang',
  DNS = 'dns',
  HARDWARE_ACCELERATION = 'hardwareAcceleration',
  TIMEOUT = 'timeout',
  UA = 'ua',
  DEBUG = 'debug',
  PROXY = 'proxy',
}

export type IStoreKey = `${IStore}`;

export const STORE_KEYS: IStoreKey[] = Object.values(IStore);

/**
 * 应用配置管理器（单例）
 *
 * - 基于 electron-store 将配置持久化到 APP_DATABASE_PATH 目录下
 * - 提供主题、语言、缩放、网络代理等多种配置的统一访问入口
 * - 通过类型化的 getter 封装默认值与数据格式，避免调用方关心底层存储细节
 *
 * 注意：这里主要是通用业务配置，与视频播放业务无关
 */
export class ConfigManager {
  private store: Store;

  /**
   * 构造函数
   *
   * - 初始化 electron-store 实例
   * - 存储文件名固定为 config.json，位于 APP_DATABASE_PATH 路径下
   */
  constructor() {
    this.store = new Store({
      name: 'config',
      cwd: APP_DATABASE_PATH,
    });
  }

  /**
   * 当前主题配置
   *
   * - 默认为 'system'，表示跟随操作系统主题
   */
  public get theme(): ITheme {
    return this.get(IStore.THEME, 'system');
  }

  /**
   * 当前语言配置
   *
   * - 默认为 'system'，表示交给 AppLocale 根据系统语言自动推导
   */
  public get lang(): ILang {
    return this.get(IStore.LANG, 'system');
  }

  /**
   * 界面缩放倍数
   *
   * - 默认 1，表示 100% 缩放
   * - WindowService 中会使用该值设置 BrowserWindow 的 zoomFactor
   */
  public get zoom(): number {
    return this.get(IStore.ZOOM, 1);
  }

  /**
   * 自定义 DNS 配置
   *
   * - 为空串时通常表示使用系统默认 DNS
   */
  public get dns(): string {
    return this.get(IStore.DNS);
  }

  /**
   * 是否启用硬件加速
   *
   * - 默认为 true，如需要排查显卡相关问题可关闭
   */
  public get hardwareAcceleration(): boolean {
    return this.get(IStore.HARDWARE_ACCELERATION, true);
  }

  /**
   * 网络请求默认超时时间（毫秒）
   *
   * - 默认 10 秒
   */
  public get timeout(): number {
    return this.get(IStore.TIMEOUT, 10 * 1000);
  }

  /**
   * 自定义 User-Agent
   *
   * - 未配置时会使用 generateUserAgent() 生成一份默认 UA
   * - WindowService / WebviewService 中会引用该值覆盖请求 UA
   */
  public get ua(): string {
    return this.get(IStore.UA, generateUserAgent());
  }

  /**
   * 是否开启调试模式
   *
   * - debug 模式下可启用额外的日志、窗口等功能（如 Sniffer 窗口）
   */
  public get debug(): boolean {
    return this.get(IStore.DEBUG, false);
  }

  /**
   * 代理配置转换为 Electron 认可的 ProxyConfig
   *
   * - type === system: 使用系统代理
   * - 存在自定义 url: 使用 fixed_servers 模式，并应用 bypass 规则
   * - 其它情况：使用 direct 模式，即不走代理
   */
  public get proxy(): ProxyConfig {
    const { type, url: proxy, bypass } = this.get(IStore.PROXY, { type: 'system', url: '', bypass: '' });
    let proxyConfig: ProxyConfig;

    if (type === PROXY_TYPE.SYSTEM) {
      proxyConfig = { mode: 'system' };
    } else if (proxy) {
      proxyConfig = { mode: 'fixed_servers', proxyRules: proxy, proxyBypassRules: bypass };
    } else {
      proxyConfig = { mode: 'direct' };
    }

    return proxyConfig;
  }

  /**
   * 设置配置项
   *
   * @param key   配置键（通常来自 IStore 枚举）
   * @param value 要写入的值
   */
  public set(key: string, value: unknown) {
    this.store.set(key, value);
  }

  /**
   * 读取配置项
   *
   * @param key          配置键（通常来自 IStore 枚举）
   * @param defaultValue 可选的默认值；当存储中不存在该 key 时返回该值
   */
  public get<T>(key: string, defaultValue?: T) {
    return this.store.get(key, defaultValue) as T;
  }
}

export const configManager = new ConfigManager();
