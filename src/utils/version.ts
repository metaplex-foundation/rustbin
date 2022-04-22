import { execSync } from 'child_process'
import satisfies from 'semver/functions/satisfies'
import { canAccess } from './fs'
import { logError, logInfo } from './log'

export const versionRx =
  /([0-9]+\.[0-9]+\.[0-9]+)(?:-[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?(?:\+[0-9A-Za-z-]+)?/

export function verifyBinVersionSatisfiesLibVersion(
  binVersion: string,
  libVersionRange: string
) {
  return satisfies(binVersion, libVersionRange)
}

export function binarySatisfies(
  fullPathToBinary: string,
  binaryVersionFlag: string,
  binaryVersionRx: RegExp,
  libVersionRange: string
) {
  if (!canAccess(fullPathToBinary)) {
    logInfo(
      `Cannot access ${fullPathToBinary} thus will need to install the first time`
    )
    return { binVersion: '<unknown>', satisfies: false }
  }
  const output = execSync(`${fullPathToBinary} ${binaryVersionFlag}`).toString()
  const match = output.match(binaryVersionRx)
  const binVersion = match == null ? null : match[0]
  if (binVersion == null) {
    logError(`Unable to extract version from ${output} will require reinstall`)
    return { binVersion: '<unknown>', satisfies: false }
  }
  return {
    binVersion,
    satisfies: satisfies(binVersion, libVersionRange),
  }
}
