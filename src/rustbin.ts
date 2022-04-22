import path from 'path'
import {
  binarySatisfies,
  logDebug,
  logInfo,
  parseCargoToml,
  versionRx,
} from './utils'
import table from 'text-table'

class Rustbin {
  readonly fullPathToBinary: string
  constructor(
    readonly rootDir: string,
    readonly binaryName: string,
    readonly binaryVersionFlag: string,
    readonly binaryVersionRx: RegExp,
    readonly libName: string,
    readonly cargoToml: string
  ) {
    this.fullPathToBinary = path.join(rootDir, 'bin', binaryName)
  }

  async check() {
    const libVersion = await this.getVersionInToml()
    const { binVersion, satisfies } = binarySatisfies(
      this.fullPathToBinary,
      this.binaryVersionFlag,
      this.binaryVersionRx,
      libVersion
    )
    const rows = [
      ['Type', 'Name', 'Version'],
      ['----', '----', '-------'],
      ['lib', this.libName, libVersion],
      ['bin', this.binaryName, binVersion],
    ]
    logInfo(table(rows))

    return { satisfies, libVersion, binVersion }
  }

  private async getVersionInToml() {
    const { parsed, toml } = await parseCargoToml(this.cargoToml)
    const libVersion = parsed.dependencies[this.libName]
    if (libVersion == null) {
      logDebug(toml)
      throw new Error(
        `${this.libName} not found as dependency in ${this.cargoToml}`
      )
    }
    return typeof libVersion === 'string' ? libVersion : libVersion.version
  }
}

export type RustbinConfig = {
  rootDir: string
  binaryName: string
  binaryVersionFlag?: string
  binaryVersionRx?: RegExp
  libName: string
  cargoToml: string
}

export function rustbinCheck(config: RustbinConfig) {
  const {
    rootDir,
    binaryName,
    libName,
    binaryVersionRx = versionRx,
    binaryVersionFlag = '--version',
    cargoToml,
  } = config
  const fullRootDir = path.resolve(rootDir)
  const fullCargoToml = path.resolve(cargoToml)
  const rustbin = new Rustbin(
    fullRootDir,
    binaryName,
    binaryVersionFlag,
    binaryVersionRx,
    libName,
    fullCargoToml
  )
  return rustbin.check()
}
