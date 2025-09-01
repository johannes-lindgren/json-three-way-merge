import * as jsondiffpatch from 'jsondiffpatch'
import * as jsonpatchFormatter from 'jsondiffpatch/formatters/jsonpatch'
import * as jsonpatch from 'fast-json-patch'
import type { Operation } from 'fast-json-patch'
import type { JsonPatch } from './JsonPatch.tsx'

const diffpatcher = jsondiffpatch.create({})

export const diffPatch = (left: unknown, right: unknown) => {
  const delta = diffpatcher.diff(left, right)
  return mergeRemoveAndAdd(jsonpatchFormatter.format(delta))
}

export const applyPatch = (doc: unknown, patch: Operation[]) =>
  jsonpatch.applyPatch(doc, patch, true, false).newDocument

// TODO implement faster version
export function canApplyPatch(doc: unknown, patch: Operation[]): boolean {
  try {
    applyPatch(doc, patch)
    return true
  } catch {
    return false
  }
}

// TODO test!
const mergeRemoveAndAdd = (ops: JsonPatch[]): JsonPatch[] => {
  const result: JsonPatch[] = []
  for (let i = 0; i < ops.length; i++) {
    const current = ops[i]
    const next = ops[i + 1]

    if (
      current &&
      next &&
      current.op === 'remove' &&
      next.op === 'add' &&
      current.path === next.path
    ) {
      // Merge into replace
      result.push({
        op: 'replace',
        path: current.path,
        value: next.value,
      })
      i++ // Skip the next one since it's merged
    } else {
      result.push(current)
    }
  }
  return result
}
