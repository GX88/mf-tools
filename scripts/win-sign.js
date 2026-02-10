const { execSync } = require('node:child_process')
const process = require('node:process')

async function sign(configuration) {
  // Always log to indicate the custom script is loaded
  console.log('  • Custom sign script executing for:', configuration.path)

  if (process.env.WIN_SIGN === 'true' || process.env.WIN_SIGN === '1') {
    const { path } = configuration
    if (configuration.path) {
      try {
        const certPath = process.env.CERT_PATH
        const keyContainer = process.env.CERT_KEY
        const csp = process.env.CERT_CSP

        if (!certPath || !keyContainer || !csp) {
          throw new Error('CERT_PATH, CERT_KEY or CERT_CSP is not set')
        }

        console.log('  • Start code signing...')
        console.log('  • Signing file:', path)
        const signCommand = `signtool sign /tr http://timestamp.comodoca.com /td sha256 /fd sha256 /v /f "${certPath}" /csp "${csp}" /k "${keyContainer}" "${path}"`
        execSync(signCommand, { stdio: 'inherit' })
        console.log('  • Code signing completed')
      }
      catch (error) {
        console.error('  • Code signing failed:', error)
        throw error
      }
    }
  }
  else {
    console.log('  • WIN_SIGN not set, skipping custom signing logic.')
  }
}

module.exports = sign
module.exports.default = sign
