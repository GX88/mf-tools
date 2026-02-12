import process from 'node:process'
import { notarize } from '@electron/notarize'
import dotenv from 'dotenv'

dotenv.config()

export default async function notarizing(context) {
  if (context.electronPlatformName !== 'darwin') {
    return
  }

  if (
    !process.env.APPLE_ID
    || !process.env.APPLE_APP_SPECIFIC_PASSWORD
    || !process.env.APPLE_TEAM_ID
  ) {
    return
  }

  const appName = context.packager.appInfo.productFilename
  const appPath = `${context.appOutDir}/${appName}.app`

  await notarize({
    appPath,
    appBundleId: 'com.mf.faith',
    appleId: process.env.APPLE_ID,
    appleIdPassword: process.env.APPLE_APP_SPECIFIC_PASSWORD,
    teamId: process.env.APPLE_TEAM_ID,
  })

  console.log('  • Notarized app:', appPath)
}
