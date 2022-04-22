import { spawn, SpawnOptions } from 'child_process'

/** @private */
export function spawnCmd(
  cmd: string,
  args: string[],
  options: SpawnOptions = {}
): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, options)
    child.on('error', reject).on('exit', resolve)

    child.stdout?.on('data', (buf) =>
      process.stdout.write(buf.toString('utf8'))
    )
    child.stderr?.on('data', (buf) =>
      process.stderr.write(buf.toString('utf8'))
    )
  })
}
