import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { app } from 'electron';

import { isPackaged } from '@main/utils/systeminfo';

import { APP_NAME_ALIAS, APP_NAME_PROTOCOL } from '@shared/config/appinfo';
import { isStrEmpty } from '@shared/modules/validate';

export const ELECTRON_PATHS = [
  'home',
  'appData',
  'userData',
  'sessionData',
  'temp',
  'exe',
  'module',
  'desktop',
  'documents',
  'downloads',
  'pictures',
  'recent', // only windows
  'logs',
  'crashDumps',
] as const;

export const SYSTEM_PATHS = ['runtime', 'resources', ...ELECTRON_PATHS] as const;
export const USER_PATHS = ['database', 'file', 'log', 'plugin', 'temp'] as const;
export const HOME_PATHS = ['bin'] as const;

export type ISystemPath = (typeof SYSTEM_PATHS)[number];
export type IUserPath = (typeof USER_PATHS)[number];
export type IHomePath = (typeof HOME_PATHS)[number];

export const getSystemPath = (name: ISystemPath): string => {
  // runtime path
  if (name === 'runtime') {
    return app.getAppPath();
  }

  // public resources path
  if (name === 'resources') {
    const resourcesPath = join(app.getAppPath(), 'resources');
    return isPackaged ? resourcesPath.replace('app.asar', 'app.asar.unpacked') : resourcesPath;
  }

  // electron path
  if (ELECTRON_PATHS.includes(name)) {
    return app.getPath(name);
  }

  return '';
};

export const getHomePath = (name: IHomePath): string => {
  if (HOME_PATHS.includes(name)) {
    return join(getSystemPath('home'), `.${APP_NAME_ALIAS}`, name);
  }

  return '';
};

export const getUserPath = (name: IUserPath): string => {
  if (USER_PATHS.includes(name)) {
    return join(getSystemPath('userData'), name);
  }

  return '';
};

export const APP_LOG_PATH: string = getUserPath('log');

/**
 * Windows: %APPDATA%\Roaming
 * Linux: $XDG_CONFIG_HOME or ~/.config
 * macOS: ~/Library/Application\ Support
 */
export const APP_EXE_PATH: string = getSystemPath('exe');
export const APP_HOME_PATH: string = getSystemPath('home');
export const APP_PUBLIC_PATH: string = getSystemPath('resources');
export const APP_STORE_PATH: string = getSystemPath('userData');

export const APP_DATABASE_PATH: string = getUserPath('database');
export const APP_FILE_PATH: string = getUserPath('file');
export const APP_TEMP_PATH: string = getUserPath('temp');

export const HOME_BIN_PATH: string = getHomePath('bin');

export const APP_REQUIRE_PATH: string[] = [
  HOME_BIN_PATH,
  APP_DATABASE_PATH,
  APP_LOG_PATH,
  APP_FILE_PATH,
];

/**
 * Validate and normalize path string
 * @param path Path string to validate
 * @returns Normalized path or empty string if invalid
 */
const validateAndNormalizePath = (path: string): string => {
  if (isStrEmpty(path)) {
    return '';
  }
  return path.trim() || '';
};

/**
 * Check if URL starts with app mark path
 * @param path URL to check
 * @returns Whether URL starts with app mark path
 */
export const isAppMarkPath = (path: string): boolean => {
  const normalized = validateAndNormalizePath(path);
  return normalized.length > 0 && normalized.startsWith(APP_NAME_PROTOCOL);
};

export const isAppFilePath = (path: string): boolean => {
  const normalized = validateAndNormalizePath(path);
  return normalized.length > 0 && normalized.startsWith('file://');
};

/**
 * Convert relative path to absolute path
 * @param path Path to convert
 * @returns Absolute path
 */
export const relativeToAbsolute = (path: string): string => {
  const normalized = validateAndNormalizePath(path);
  if (!normalized) return '';

  if (isAppMarkPath(normalized)) {
    return normalized.replace(APP_NAME_PROTOCOL, APP_STORE_PATH);
  }

  if (isAppFilePath(normalized)) {
    return fileURLToPath(normalized);
  }

  return normalized;
};


export default {
  getSystemPath,
  getUserPath,
};
