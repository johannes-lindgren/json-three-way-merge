import './App.css'
import { MonacoJsonHighlight } from './MonacoJsonHighlight.tsx'
import { type FunctionComponent, type ReactNode, useState } from 'react'
import SimpleTextEditor from './SimpleTextEditor.tsx'
import { formatResult, parseJson } from 'pure-parse'
import { type JsonPatch } from './JsonPatch.tsx'
import { css } from './Css.tsx'
import { applyPatch, diffPatch } from './differ.ts'

const defaultBase = {
  items: ['a', 'b', 'c', 'd', 'e'],
  user: {
    name: 'Alice',
    age: 30,
    address: {
      street: '123 Main St',
      city: 'Wonderland',
    },
  },
  settings: {
    theme: 'light',
    notifications: true,
    languages: ['en', 'fr', 'de'],
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

  const [targetText, setTargetText] = useState(baseText)
  const targetParseResult = parseJson(targetText)

  const handleApplyPatch = (patch: JsonPatch) => {
    setTargetText((resolutionText) => {
      const result = parseJson(resolutionText)
      if (result.error) {
        return resolutionText
      }
      const patchesInPath = rightPatches.filter(
        (pat) => pat.path === patch.path,
      )
      const newResolutionText = applyPatch(result.value, patchesInPath)
      return JSON.stringify(newResolutionText, null, 2)
    })
  }

  const handleDismissPatch = (patch: JsonPatch) => {
    alert('Not implemented yet')
    console.log('Dismiss patch', patch)
  }

  const handleReset = () => {
    setBaseText(stringify(defaultBase))
    setRightText(stringify(defaultRight))
    setTargetText(stringify(defaultBase))
  }

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      <h1>JSON Patch Merge</h1>
      <p>A JSON-specific merge tool.</p>
      <div style={{ maxWidth: '600px', textAlign: 'left' }}>
        <p>This is a proof of concept of a merge tool for JSON documents.</p>
        <p>
          Try it by:
          <ol style={{ listStylePosition: 'inside' }}>
            <li>
              Editing the right side of the document. This simulates an incoming
              change.
            </li>
            <li>Scroll down to see the generated JSON patches (readonly)</li>
            <li>Scroll down again to see the merge editor.</li>
            <li>Apply a patch by clicking "{'<<'}"</li>
          </ol>
        </p>
      </div>
      <div>
        <button onClick={handleReset}>Reset</button>
      </div>
      <div
        style={{
          display: 'flex',
          gap: 20,
          flexDirection: 'column',
          width: '100%',
        }}
      >
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
              value={targetText}
              onChange={setTargetText}
            />
          </div>
          <div className="panel">
            <h2>Right</h2>
            <MonacoJsonHighlight
              targetDoc={
                targetParseResult.error ? undefined : targetParseResult.value
              }
              doc={rightValue}
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
  <div style={{ color: 'red', fontWeight: 'bold', margin: 20 }}>
    {props.children}
  </div>
)

export default App
