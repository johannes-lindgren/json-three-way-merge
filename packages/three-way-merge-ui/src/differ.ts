import * as jsondiffpatch from 'jsondiffpatch'
import * as jsonpatchFormatter from 'jsondiffpatch/formatters/jsonpatch'
import * as jsonpatch from 'fast-json-patch'
import type { Operation } from 'fast-json-patch'

const diffpatcher = jsondiffpatch.create({})

export const diffPatch = (left: unknown, right: unknown) => {
  const delta = diffpatcher.diff(left, right)
  return jsonpatchFormatter.format(delta)
}

export const applyPatch = (doc: unknown, patch: Operation[]) =>
  jsonpatch.applyPatch(doc, patch, true, false)

// TODO implement faster version
export function canApplyPatch(doc: unknown, patch: Operation[]): boolean {
  try {
    const res = applyPatch(doc, patch)
    console.log('can apply', patch, 'to', doc, '=', res)
    return true
  } catch {
    console.log('cannot apply', patch)
    return false
  }
}
