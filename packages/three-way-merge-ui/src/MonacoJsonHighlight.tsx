import React, { useEffect, useRef } from "react";
import Editor from "@monaco-editor/react";
import * as monaco from "monaco-editor";
import { findNodeAtLocation, type Node, parseTree } from "jsonc-parser";
import type { JsonPatch } from "./JsonPatch.tsx";

type Props = {
  json: unknown;
  patch: JsonPatch;
};

// Map patch type → class
const patchClassMap: Record<JsonPatch["op"], string> = {
  add: "highlight-add",
  remove: "highlight-remove",
  replace: "highlight-replace",
  move: "highlight-move",
};

// A helper for formatting CSS in a template literal
const css = (strings: TemplateStringsArray, ...expr: any[]) =>
  String.raw(strings, ...expr);

export const MonacoJsonHighlight: React.FC<Props> = ({ json, patch }) => {
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const decorationsRef =
    useRef<monaco.editor.IEditorDecorationsCollection | null>(null);

  const formatted = JSON.stringify(json, null, 2);
  const recalcDecorations = (value: string) => {
    if (!editorRef.current || !decorationsRef.current) return;

    const tree = parseTree(value);
    if (!tree) return;

    const tokens = patch.path.split("/").slice(1);
    let node: Node | undefined = findNodeAtLocation(tree, tokens);

    if (!node && tokens.length > 0) {
      const parentTokens = tokens.slice(0, -1);
      node = findNodeAtLocation(tree, parentTokens);
    }

    if (!node) {
      decorationsRef.current.clear();
      return;
    }

    const model = editorRef.current.getModel();
    if (!model) return;

    const start = model.getPositionAt(node.offset);
    const end = model.getPositionAt(node.offset + node.length);

    decorationsRef.current.clear();

    // When adding decoration:
    decorationsRef.current?.append([
      {
        range: new monaco.Range(
          start.lineNumber,
          start.column,
          end.lineNumber,
          end.column,
        ),
        options: { inlineClassName: patchClassMap[patch.op] },
      },
    ]);
  };

  useEffect(() => {
    // Clean up decorations when the component unmounts
    return () => {
      decorationsRef.current?.clear();
    };
  }, []);

  return (
    <div style={{ height: "400px", border: "1px solid #ddd" }}>
      <Editor
        defaultLanguage="json"
        defaultValue={formatted}
        onMount={(editor) => {
          editorRef.current = editor;
          decorationsRef.current = editor.createDecorationsCollection();
          recalcDecorations(formatted);
        }}
        onChange={(value) => {
          if (value) recalcDecorations(value);
        }}
        options={{
          readOnly: false, // editor is editable
          minimap: { enabled: false },
          fontSize: 14,
        }}
      />
      <style>
        {css`
          .highlight-replace {
            background-color: rgba(65, 105, 225, 0.3); /* blue for add */
          }
          .highlight-remove {
            background-color: rgba(220, 20, 60, 0.3); /* red for remove */
            text-decoration: line-through;
          }
          .highlight-add {
            background-color: rgba(34, 139, 34, 0.3); /* green for move */
          }
        `}
      </style>
    </div>
  );
};
