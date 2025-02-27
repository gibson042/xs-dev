import os from 'os'
import { filesystem, print, prompt, system } from 'gluegun'
import upsert from '../patching/upsert'
import { getProfilePath } from './constants'

function getBrewPath(): string {
  if (os.arch() === 'arm64') return '/opt/homebrew/bin'
  return '/usr/local/bin'
}

export async function ensureHomebrew(): Promise<void> {
  if (system.which('brew') === null) {
    const brewPath = getBrewPath()
    const homebrewEval = `eval "$(${brewPath}/brew shellenv)"`

    if (filesystem.exists(brewPath) === 'dir') {
      process.env.PATH = `${brewPath}:${String(process.env.PATH)}`
      return;
    }

    const shouldInstallBrew = await prompt.confirm(`The "brew" command is not available. Homebrew is required to install necessary dependencies. Would you like to setup Homebrew automatically?`)

    if (shouldInstallBrew) {
      try {
        print.info('Running Homebrew install script...')
        await system.exec(`/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"`, {
          shell: process.env.SHELL,
          stdout: process.stdout,
          stdin: process.stdin,
        })
        const PROFILE_PATH = getProfilePath()
        await upsert(PROFILE_PATH, homebrewEval)
        process.env.PATH = `${brewPath}:${String(process.env.PATH)}`
        return;
      } catch (error: unknown) {
        if (error instanceof Error) {
          print.error(`Unable to install Homebrew: ${error.message}`)
        }
      }
    }

    throw new Error(`Visit https://brew.sh/ to learn more about installing Homebrew. If you don't want to use Homebrew, please install the following packages manually before trying this command again: `)
  }
}
