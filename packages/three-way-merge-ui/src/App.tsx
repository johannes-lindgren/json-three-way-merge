import "./App.css"
import { MonacoJsonHighlight } from "./MonacoJsonHighlight.tsx"
import { type FunctionComponent, type ReactNode, useState } from "react"
import SimpleTextEditor from "./SimpleTextEditor.tsx"
import { formatResult, parseJson } from "pure-parse"
import { type JsonPatch } from "./JsonPatch.tsx"
import { css } from "./Css.tsx"
import { applyPatches, diffPatch } from "./differ.ts"

const defaultBase = {
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

const defaultRight = defaultBase

const stringify = (obj: unknown) => JSON.stringify(obj, null, 2)

function App() {
  const [baseText, setBaseText] = useState(() => stringify(defaultBase))
  const [rightText, setRightText] = useState(() => stringify(defaultRight))

  const baseParseResult = parseJson(baseText)
  const rightParseResult = parseJson(rightText)

  const baseValue = baseParseResult.error ? null : baseParseResult.value
  const rightValue = rightParseResult.error ? null : rightParseResult.value

  const rightPatches = diffPatch(baseValue, rightValue)

  // TODO allow customizing the patches again?
  // const [patchText, setPatchText] = useState(
  //   JSON.stringify(defaultPatches, null, 2),
  // )
  // const patchParseResult = chain(parseJson, parseJsonPatches)(patchText)

  const [resolutionText, setResolutionText] = useState(baseText)

  const handleApplyPatch = (patch: JsonPatch) => {
    setResolutionText((resolutionText) => {
      const result = parseJson(resolutionText)
      if (result.error) {
        return resolutionText
      }
      const patchesInPath = rightPatches.filter(
        (pat) => pat.path === patch.path,
      )
      console.log("Apply patch", patchesInPath)
      const newResolutionText = applyPatches(result.value, patchesInPath)
      return JSON.stringify(newResolutionText, null, 2)
    })
  }

  const handleDismissPatch = (patch: JsonPatch) => {
    console.log("Dismiss patch", patch)
  }

  const handleReset = () => {
    setBaseText(stringify(defaultBase))
    setRightText(stringify(defaultRight))
    setResolutionText(stringify(defaultBase))
  }

  return (
    <div style={{ flex: 1 }}>
      <button onClick={handleReset}>Reset</button>
      <h1>JSON Patch Highlight Example</h1>
      <div style={{ display: "flex", gap: 20, flexDirection: "column" }}>
        <div className="three-way-container">
          <div className="panel">
            <h2>Base</h2>
            <p>This is the common ancestor</p>
            <SimpleTextEditor
              value={baseText}
              onChange={setBaseText}
            />
            {baseParseResult.error && (
              <ErrorMessage>
                Error parsing patch: {formatResult(baseParseResult)}
              </ErrorMessage>
            )}
          </div>
          <div className="panel">
            <h2>Right</h2>
            <p>These changes needs to be merged with left.</p>
            <SimpleTextEditor
              value={rightText}
              onChange={setRightText}
            />
            {rightParseResult.error && (
              <ErrorMessage>
                Error parsing patch: {formatResult(rightParseResult)}
              </ErrorMessage>
            )}
          </div>
        </div>
        <div className="three-way-container">
          <div className="panel"></div>
          <div className="panel">
            <h2>Patches</h2>
            <p>Applying these patches will result in right</p>
            <SimpleTextEditor
              value={stringify(rightPatches)}
              readonly
            />
          </div>
        </div>
        <div className="three-way-container">
          <div className="panel">
            <h2>Result</h2>
            <SimpleTextEditor
              value={resolutionText}
              onChange={setResolutionText}
            />
          </div>
          <div className="panel">
            <h2>Right</h2>
            <MonacoJsonHighlight
              json={rightValue}
              patches={rightPatches}
              readonly
              onApply={handleApplyPatch}
              onDismiss={handleDismissPatch}
            />
          </div>
        </div>
      </div>
      <style>{css`
        .three-way-container {
          display: flex;
          flex-wrap: nowrap;
          flex: 1;
        }
        .panel {
          display: flex;
          flex-direction: column;
          flex: 0.5;
        }
      `}</style>
    </div>
  )
}

const ErrorMessage: FunctionComponent<{
  children?: ReactNode
}> = (props) => (
  <div style={{ color: "red", fontWeight: "bold", margin: 20 }}>
    {props.children}
  </div>
)

export default App
