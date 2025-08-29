import * as jsondiffpatch from "jsondiffpatch"
import * as jsonpatchFormatter from "jsondiffpatch/formatters/jsonpatch"

const diffpatcher = jsondiffpatch.create({})

export const diffPatch = (left: unknown, right: unknown) => {
  const delta = diffpatcher.diff(left, right)
  return jsonpatchFormatter.format(delta)
}

export const applyPatches = (
  root: unknown,
  patches: jsonpatchFormatter.Op[],
) => {
  const target = diffpatcher.clone(root)
  jsonpatchFormatter.patch(target, patches)
  return target
}
