import { promises as fs } from 'fs'

export async function canAccess(p: string) {
  try {
    await fs.access(p)
    return true
  } catch (_) {
    return false
  }
}
export async function ensureDir(dir: string) {
  if (!(await canAccess(dir))) {
    await fs.mkdir(dir, { recursive: true })
    return
  }
  // dir already exists, make sure it isn't a file
  const stat = await fs.stat(dir)
  if (!stat.isDirectory()) {
    throw new Error(`'${dir}' is not a directory`)
  }
}
