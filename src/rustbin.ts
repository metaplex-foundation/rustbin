import path from 'path'
import {
  binarySatisfies,
  logDebug,
  logInfo,
  parseCargoToml,
  spawnCmd,
  versionRx,
} from './utils'
import table from 'text-table'

export class Rustbin {
  readonly fullPathToBinary: string
  private constructor(
    readonly rootDir: string,
    readonly binaryName: string,
    readonly binaryCrateName: string,
    readonly binaryVersionFlag: string,
    readonly binaryVersionRx: RegExp,
    readonly libName: string,
    readonly cargoToml: string,
    readonly dryRun: boolean
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

    return {
      satisfies,
      libVersion,
      binVersion,
    }
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

  async installMatchinBin(libVersionRange: string) {
    // cargo install anchor-cli --version 0.24.2 --force --root `pwd`/scripts
    const cmd = 'cargo'
    const args = [
      'install',
      this.binaryCrateName,
      '--version',
      `'${libVersionRange}'`,
      '--force',
      '--root',
      this.rootDir,
    ]
    const fullCmd = `${cmd} ${args.join(' ')}`
    logInfo(fullCmd)
    if (!this.dryRun) {
      await spawnCmd(cmd, args)
    }

    return fullCmd
  }

  static fromConfig(config: RustbinConfig) {
    const {
      rootDir,
      binaryName,
      libName,
      binaryVersionRx = versionRx,
      binaryVersionFlag = '--version',
      dryRun = false,
      cargoToml,
    } = config
    const { binaryCrateName = binaryName } = config
    const fullRootDir = path.resolve(rootDir)
    const fullCargoToml = path.resolve(cargoToml)
    return new Rustbin(
      fullRootDir,
      binaryName,
      binaryCrateName,
      binaryVersionFlag,
      binaryVersionRx,
      libName,
      fullCargoToml,
      dryRun
    )
  }
}

export type RustbinConfig = {
  rootDir: string
  binaryName: string
  binaryCrateName?: string
  binaryVersionFlag?: string
  binaryVersionRx?: RegExp
  libName: string
  cargoToml: string
  dryRun?: boolean
}

export function rustbinCheck(config: RustbinConfig) {
  const rustbin = Rustbin.fromConfig(config)
  return rustbin.check()
}

export async function rustbinSync(config: RustbinConfig) {
  const rustbin = Rustbin.fromConfig(config)
  const { satisfies, libVersion } = await rustbin.check()
  if (satisfies) return { fullPathToBinary: rustbin.fullPathToBinary }

  logInfo(`Installing ${libVersion} compatible version of ${config.binaryName}`)
  const cmd = await rustbin.installMatchinBin(libVersion)
  return { cmd, fullPathToBinary: rustbin.fullPathToBinary }
}
