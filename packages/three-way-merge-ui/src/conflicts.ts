import { type Operation } from 'fast-json-patch'

export type PatchConflict = {
  path: string
  patchesA: Operation[]
  patchesB: Operation[]
}

export const findConflictsByPath = (
  patchSetA: Operation[],
  patchSetB: Operation[],
): PatchConflict[] => {
  const conflicts: PatchConflict[] = []
  const paths = new Set([
    ...patchSetA.map((p) => p.path),
    ...patchSetB.map((p) => p.path),
  ])

  for (const path of paths) {
    const aPatches = patchSetA.filter((p) => p.path === path)
    const bPatches = patchSetB.filter((p) => p.path === path)

    if (aPatches.length > 0 && bPatches.length > 0) {
      conflicts.push({ path, patchesA: aPatches, patchesB: bPatches })
    }
  }

  return conflicts
}
