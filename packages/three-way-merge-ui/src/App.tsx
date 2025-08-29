import "./App.css"
import {
  MonacoJsonHighlight,
  type MonacoJsonHighlightProps,
} from "./MonacoJsonHighlight.tsx"
import { useState } from "react"
import SimpleTextEditor from "./SimpleTextEditor.tsx"
import { chain, formatResult, parseJson } from "pure-parse"
import { type JsonPatch, parseJsonPatches } from "./JsonPatch.tsx"

const baseJson: MonacoJsonHighlightProps["json"] = {
  items: ["a", "b", "c", "d", "e"],
  user: {
    name: "Alice",
    age: 30,
    address: {
      street: "123 Main St",
      city: "Wonderland",
    },
  },
  settings: {
    theme: "light",
    notifications: true,
    languages: ["en", "fr", "de"],
  },
}

// Example patches
const defaultPatches: JsonPatch[] = [
  { op: "add", path: "/items/2", value: "x" },
  { op: "replace", path: "/user/name", value: "Bob" },
  { op: "remove", path: "/settings/notifications" },
  { op: "add", path: "/settings/languages/1", value: "es" },
  { op: "move", from: "/user/address/street", path: "/user/street" }, // move street up
]

function App() {
  const [patchText, setPatchText] = useState(
    JSON.stringify(defaultPatches, null, 2),
  )

  const patchResult = chain(parseJson, parseJsonPatches)(patchText)

  return (
    <>
      <h1>JSON Patch Highlight Example</h1>
      <div style={{ display: "flex", gap: 20, flexDirection: "column" }}>
        <div>
          <h2>Patches</h2>
          <SimpleTextEditor
            value={patchText}
            onChange={setPatchText}
          />
        </div>
        <div>
          <h2>Left/Right</h2>
          {patchResult.error ? (
            <div style={{ color: "red" }}>
              Error parsing patch: {formatResult(patchResult)}
            </div>
          ) : (
            <MonacoJsonHighlight
              json={baseJson}
              patches={patchResult.value}
              onApply={() => console.log("Apply clicked")}
              onDismiss={() => console.log("Dismiss clicked")}
            />
          )}
        </div>
      </div>
    </>
  )
}

export default App
