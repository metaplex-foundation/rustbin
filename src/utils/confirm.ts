export type ConfirmInstallArgs = {
  binaryName: string
  libName: string
  libVersion: string
  binVersion?: string
  fullPathToBinary: string
}
export type ConfirmInstall = (args: ConfirmInstallArgs) => Promise<boolean>

export function confirmAutoMessageConsole({
  binaryName,
  libVersion,
  libName,
  binVersion,
  fullPathToBinary,
}: ConfirmInstallArgs) {
  if (binVersion == null) {
    console.error(`No existing version found for ${binaryName}.`)
  } else {
    console.error(`Version for ${binaryName}: ${binVersion}`)
  }
  console.error(
    `Will install version matching "${libName}: '${libVersion}'" to ${fullPathToBinary}`
  )
  Promise.resolve(true)
}
