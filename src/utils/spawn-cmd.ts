import { spawn, SpawnOptions } from 'child_process'

// error: could not find `anchor-cli` in registry `crates-io` with version `~0.22`
const installNotFoundRx = /error\: could not find.+in registry/

/** @private */
export function spawnCmd(
  cmd: string,
  args: string[],
  options: SpawnOptions = {}
): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    let rejected = false
    const child = spawn(cmd, args, options)

    child.stdout?.on('data', (buf) => process.stdout.write(buf))
    child.stderr?.on('data', (buf) => {
      const msg = buf.toString()
      if (installNotFoundRx.test(msg)) {
        rejected = true
        child.kill()
        reject(new Error(msg))
      } else {
        process.stderr.write(buf)
      }
    })

    child
      .on('error', (err) => {
        rejected = true
        reject(err)
      })
      .on('exit', () => {
        if (!rejected) resolve()
      })
  })
}
