import React, { useEffect, useRef } from "react"
import Editor from "@monaco-editor/react"
import * as monaco from "monaco-editor"
import { findNodeAtLocation, type Node, parseTree } from "jsonc-parser"
import type { JsonPatch } from "./JsonPatch.tsx"
import { createPortal } from "react-dom"

// Map patch type → class
const patchClassMap: Record<JsonPatch["op"], string> = {
  add: "highlight-add",
  remove: "highlight-remove",
  replace: "highlight-replace",
  move: "highlight-move",
}

// A helper for formatting CSS in a template literal
const css = (strings: TemplateStringsArray, ...expr: any[]) =>
  String.raw(strings, ...expr)

export type MonacoJsonHighlightProps = {
  json: unknown
  patches: JsonPatch[]
  onApply: () => void
  onDismiss: () => void
}
const addPatchWidget = (
  editor: monaco.editor.IStandaloneCodeEditor,
  lineNumber: number,
  patchId: string,
  portalTarget: HTMLElement,
) => {
  const container = document.createElement("div")
  container.style.position = "absolute"
  container.style.left = "0px"
  container.style.zIndex = "1000" // ensure it sits above editor layers
  container.appendChild(portalTarget)

  // Append to the editor's DOM node
  editor.getDomNode()?.appendChild(container)

  const updatePosition = () => {
    const top = editor.getTopForLineNumber(lineNumber) - editor.getScrollTop()
    container.style.top = `${top}px`
  }

  updatePosition()

  // Update when the editor scrolls
  const disposable = editor.onDidScrollChange(updatePosition)

  return () => {
    disposable.dispose()
    container.remove()
  }
}

export const MonacoJsonHighlight: React.FC<MonacoJsonHighlightProps> = (
  props,
) => {
  const { json, patches, onApply, onDismiss } = props

  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null)
  const decorationsRef =
    useRef<monaco.editor.IEditorDecorationsCollection | null>(null)

  const formatted = JSON.stringify(json, null, 2)

  const patchInfo = patches.map((patch) => ({
    patch,
    portalTarget: document.createElement("div"),
  }))

  const recalcDecorations = (value: string) => {
    const editor = editorRef.current
    if (!editor || !decorationsRef.current) {
      return
    }

    const tree = parseTree(value)
    if (!tree) {
      return
    }

    const model = editor.getModel()
    if (!model) {
      return
    }

    decorationsRef.current.clear()
    const newDecorations: monaco.editor.IModelDeltaDecoration[] = []

    for (const p of patchInfo) {
      const { patch, portalTarget } = p
      const tokens = patch.path.split("/").slice(1)
      let node: Node | undefined = findNodeAtLocation(tree, tokens)

      if (!node && tokens.length > 0) {
        const parentTokens = tokens.slice(0, -1)
        node = findNodeAtLocation(tree, parentTokens)
      }

      if (!node) continue

      const start = model.getPositionAt(node.offset)
      const end = model.getPositionAt(node.offset + node.length)

      addPatchWidget(editor, start.lineNumber, patch.path, portalTarget)

      decorationsRef.current?.append([
        {
          range: new monaco.Range(
            start.lineNumber,
            start.column,
            end.lineNumber,
            end.column,
          ),
          options: {
            isWholeLine: true,
            className: patchClassMap[patch.op],
          },
        },
      ])
    }

    // Apply all decorations at once
    decorationsRef.current.append(newDecorations)
  }

  useEffect(() => {
    // Clean up decorations when the component unmounts
    return () => {
      decorationsRef.current?.clear()
    }
  }, [])

  return (
    <div
      style={{ height: "400px", border: "1px solid #ddd", overflow: "hidden" }}
    >
      <Editor
        defaultLanguage="json"
        defaultValue={formatted}
        onMount={(editor) => {
          editorRef.current = editor
          decorationsRef.current = editor.createDecorationsCollection()
          recalcDecorations(formatted)
        }}
        onChange={(value) => {
          if (value) recalcDecorations(value)
        }}
        options={{
          readOnly: false, // editor is editable
          minimap: { enabled: false },
          fontSize: 14,
          language: "json",
          glyphMargin: true,
          suggestOnTriggerCharacters: false, // disables on ":" or ","
          quickSuggestions: false, // disables inline suggestions
        }}
      />
      {patchInfo.map((p) =>
        createPortal(
          <div
            className="button-container"
            key={p.patch.path}
          >
            <button
              className="inline-button"
              onClick={onApply}
            >
              {"<<"}
            </button>
            <button
              className="inline-button"
              onClick={onDismiss}
            >
              X
            </button>
          </div>,
          p.portalTarget,
        ),
      )}
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
          .highlight-move {
            background-color: rgba(255, 165, 0, 0.3); /* orange for move */
          }
          .button-container {
            display: flex;
            flex-wrap: nowrap;
            padding: 0 4px;
          }
          .inline-button {
            border: 0;
            padding: 2px;
            color: rgba(0, 0, 0, 0.8);
            background-color: unset;
            transition: color 0.2s;
            font-family: Menlo, Monaco, "Courier New", monospace;
            font-weight: normal;
            font-size: 14px;
            font-feature-settings:
              "liga" 0,
              "calt" 0;
            font-variation-settings: normal;
            line-height: 21px;
            letter-spacing: 0px;
          }
          .inline-button:hover {
            color: rgba(0, 0, 0, 0.4);
          }
        `}
      </style>
    </div>
  )
}
