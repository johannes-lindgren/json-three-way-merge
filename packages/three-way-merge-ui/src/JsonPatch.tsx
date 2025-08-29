import {
  array,
  equals,
  object,
  oneOf,
  parseString,
  parseUnknown,
} from "pure-parse";

export type JsonPatch =
  | { op: "add"; path: string; value: unknown }
  | { op: "remove"; path: string }
  | { op: "replace"; path: string; value: unknown }
  | { op: "move"; from: string; path: string };

export const parseJsonPatch = oneOf(
  object({
    op: equals("add"),
    path: parseString,
    value: parseUnknown,
  }),
  object({
    op: equals("remove"),
    path: parseString,
  }),
  object({
    op: equals("replace"),
    path: parseString,
    value: parseUnknown,
  }),
  object({
    op: equals("move"),
    from: parseString,
    path: parseString,
  }),
);

export const parseJsonPatches = array<JsonPatch>(parseJsonPatch);
