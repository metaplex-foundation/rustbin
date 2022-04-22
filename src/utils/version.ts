import { spawnSync } from 'child_process'
import satisfies from 'semver/functions/satisfies'
import { canAccess } from './fs'
import { logDebug, logError, logInfo } from './log'

/** @private */
export const versionRx =
  /([0-9]+\.[0-9]+\.[0-9]+)(?:-[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?(?:\+[0-9A-Za-z-]+)?/

/** @private */
export async function binarySatisfies(
  fullPathToBinary: string,
  binaryVersionFlag: string,
  binaryVersionRx: RegExp,
  libVersionRange: string
) {
  if (!(await canAccess(fullPathToBinary))) {
    logInfo(
      `Cannot access ${fullPathToBinary} thus will need to install the first time`
    )
    return { binVersion: undefined, satisfies: false }
  }
  const versionCmd = `${fullPathToBinary} ${binaryVersionFlag}`
  const { stdout, stderr, error } = spawnSync(fullPathToBinary, [
    binaryVersionFlag,
  ])
  if (error) {
    logError(`Error running ${versionCmd}: ${error}`)
    throw error
  }
  const output = `${stdout.toString()}${stderr.toString()}`

  logDebug(`versionCmd: ${versionCmd} ->\n${output}`)
  const match = output.match(binaryVersionRx)
  const binVersion = match == null ? null : match[0]
  if (binVersion == null) {
    logError(`Unable to extract version from ${output} will require reinstall`)
    return { binVersion: undefined, satisfies: false }
  }
  return {
    binVersion,
    satisfies: satisfies(binVersion, libVersionRange),
  }
}
