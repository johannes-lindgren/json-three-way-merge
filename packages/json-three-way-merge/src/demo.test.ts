import { describe, expect, it } from "vitest";
import * as jsondiffpatch from "jsondiffpatch";
import * as jsonpatchFormatter from "jsondiffpatch/formatters/jsonpatch";

type Patch = jsonpatchFormatter.Op;
type Conflict = {
  left: Patch[];
  right: Patch[];
};

const diffpatcher = jsondiffpatch.create({});

const diffPatch = (left: unknown, right: unknown) => {
  const delta = diffpatcher.diff(left, right);
  return jsonpatchFormatter.format(delta);
};

const sortPatches = (
  left: Patch[],
  right: Patch[],
): {
  nonConflicts: Patch[];
  conflicts: Conflict[];
} => {
  // TODO implement
  return {
    nonConflicts: [...left, ...right],
    conflicts: [],
  };
};

const applyNonConflictingPatches = (
  root: unknown,
  left: Patch[],
  right: Patch[],
): {
  result: unknown;
  conflicts: Conflict[];
} => {
  const target = diffpatcher.clone(root);

  const res = sortPatches(left, right);

  jsonpatchFormatter.patch(target, res.nonConflicts);

  return {
    result: target,
    conflicts: res.conflicts,
  };
};

const threeWayMerge = (root: unknown, left: unknown, right: unknown) => {
  const leftPatch = diffPatch(root, left);
  const rightPatch = diffPatch(root, right);

  return applyNonConflictingPatches(root, leftPatch, rightPatch);
};

const toNotHaveConflicts = () =>
  expect.objectContaining({
    conflicts: [],
  });

const toHaveResult = (result: unknown) =>
  expect.objectContaining({
    result,
  });

/*
 * Terminology:
 * - root: the common ancestor of left and right
 * - left: one version of the object, derived from root
 * - right: another version of the object, derived from root
 */

describe("conflict resolution", () => {
  it("merges non-conflicting changes", () => {
    const root = { a: 0, b: 0 };
    const left = { a: -1, b: 0 };
    const right = { a: 0, b: 1 };
    const result = threeWayMerge(root, left, right);
    expect(result).toEqual(toNotHaveConflicts());
    expect(result).toEqual(
      toHaveResult({
        a: -1,
        b: 1,
      }),
    );
  });
  describe("no changes", () => {
    it("results in no changes", () => {
      const root = { a: 0, b: 1 };
      const result = threeWayMerge(root, root, root);
      expect(result).toEqual(toHaveResult(root));
    });
    it("results in no conflicts", () => {
      const root = { a: 0, b: 1 };
      const result = threeWayMerge(root, root, root);
      expect(result).toEqual(toNotHaveConflicts());
    });
  });
  describe("No parallel changes", () => {
    it("results in right when left is unchanged", () => {
      const root = { a: 0, b: 0 };
      const right = { a: 0, b: 1 };
      const result = threeWayMerge(root, root, right);
      expect(result).toEqual(toNotHaveConflicts());
      expect(result).toEqual(toHaveResult(right));
    });
    it("results in left when right is unchanged", () => {
      const root = { a: 0, b: 0 };
      const left = {
        a: -1,
        b: 0,
      };
      const result = threeWayMerge(root, left, root);
      expect(result).toEqual(toNotHaveConflicts());
      expect(result).toEqual(toHaveResult(left));
    });
  });
});
