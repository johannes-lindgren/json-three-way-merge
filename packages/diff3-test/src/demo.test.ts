import { describe, it, expect } from "vitest";
import diff3Merge from "diff3";

describe("3-way merge with diff3", () => {
  it("should produce structured hunks", () => {
    const base = ["a", "b", "c"];
    const ours = ["a", "a", "a", "a", "a", "b", "1"];
    const theirs = ["a", "b", "2"];

    const result = diff3Merge(ours, base, theirs);

    console.log("result", result);

    // Check non-conflicting hunks
    const nonConflicts = result.filter((h) => h.ok).flatMap((h) => h.ok);
    expect(nonConflicts).toContain("line 1");

    // Check conflicts
    const conflicts = result.filter((h) => h.conflict || !h.ok);
    expect(conflicts.length).toBeGreaterThan(0);

    // Example: check first conflict structure
    const firstConflict = conflicts[0];
    expect(firstConflict.a).toEqual(["line 2 modified"]);
    expect(firstConflict.o).toEqual(["line 2"]);
    expect(firstConflict.b).toEqual(["line 2"]);
  });
});
