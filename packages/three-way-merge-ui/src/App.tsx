import './App.css'
import { MonacoJsonHighlight } from './MonacoJsonHighlight.tsx'
import {
  type FunctionComponent,
  type ReactNode,
  useMemo,
  useState,
} from 'react'
import SimpleTextEditor from './SimpleTextEditor.tsx'
import { formatResult, parseJson } from 'pure-parse'
import { type JsonPatchOp } from './JsonPatchOp.tsx'
import { css } from './Css.tsx'
import { applyPatch, diffPatch } from './differ.ts'
import { findConflictsByPath } from './conflicts.ts'

const defaultBase = {
  id: 0,
  uid: 'abc',
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

const defaultLeft = defaultBase
const defaultRight = defaultBase

const stringify = (obj: unknown) => JSON.stringify(obj, null, 2)

function App() {
  const [leftText, setLeftText] = useState(() => stringify(defaultBase))
  const [baseText, setBaseText] = useState(() => stringify(defaultBase))
  const [rightText, setRightText] = useState(() => stringify(defaultRight))

  const leftParseResult = parseJson(leftText)
  const baseParseResult = parseJson(baseText)
  const rightParseResult = parseJson(rightText)

  const leftValue = leftParseResult.error ? null : leftParseResult.value
  const baseValue = baseParseResult.error ? null : baseParseResult.value
  const rightValue = rightParseResult.error ? null : rightParseResult.value

  const leftPatches = diffPatch(baseValue, leftValue)
  const rightPatches = diffPatch(baseValue, rightValue)
  console.log('leftPatches', leftPatches)
  console.log('rightPatches', rightPatches)
  const conflicts = useMemo(
    () => findConflictsByPath(leftPatches, rightPatches),
    [leftPatches, rightPatches],
  )

  const [targetText, setTargetText] = useState(baseText)
  const targetParseResult = parseJson(targetText)

  const handleApplyPatch = (op: JsonPatchOp) => {
    setTargetText((currentTargetText) => {
      const result = parseJson(currentTargetText)
      if (result.error) {
        return currentTargetText
      }
      const newResolutionText = applyPatch(result.value, [op])
      return JSON.stringify(newResolutionText, null, 2)
    })
  }

  const handleDismissPatch = (op: JsonPatchOp) => {
    alert('Not implemented yet')
    console.log('Dismiss patch', op)
  }

  const handleReset = () => {
    setLeftText(stringify(defaultLeft))
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
      <p>A three-way merge tool that operates on JSON documents.</p>
      <div style={{ maxWidth: '600px', textAlign: 'left' }}>
        <p>This is a proof of concept of a merge tool for JSON documents.</p>
        <p>Try it by:</p>
        <ol style={{ listStylePosition: 'inside' }}>
          <li>
            Editing the right side of the document. This simulates an incoming
            change.
          </li>
          <li>Scroll down to see the generated JSON patches (readonly)</li>
          <li>Scroll down again to see the merge editor.</li>
          <li>Apply a patch by clicking "{'<<'}"</li>
        </ol>
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
        <div className="section">
          <h2>Document Versions</h2>
          <p>
            This section represents the three different versions of the
            document.
          </p>
          <div className="three-way-container">
            <div className="panel">
              <h3>Left</h3>
              <p>
                These changes needs to be merged with <i>right</i>.
              </p>
              <SimpleTextEditor
                value={leftText}
                onChange={setLeftText}
              />
              {leftParseResult.error && (
                <ErrorMessage>
                  Error parsing patch: {formatResult(leftParseResult)}
                </ErrorMessage>
              )}
            </div>
            <div className="panel">
              <h3>Base</h3>
              <p>
                This is the common ancestor of <i>left</i> and <i>right</i>
              </p>
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
              <h3>Right</h3>
              <p>
                These changes needs to be merged with <i>left</i>.
              </p>
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
        </div>
        <div className="section">
          <h2>JSON Patches Versions</h2>
          <p>Here you see the calculated JSON patches.</p>
          <div className="three-way-container">
            <div className="panel">
              <h3>Left</h3>
              <p>
                Applying these patches will result in <i>left</i>
              </p>
              <SimpleTextEditor
                value={stringify(leftPatches)}
                readonly
              />
            </div>
            <div className="panel"></div>
            <div className="panel">
              <h3>Right</h3>
              <p>Applying these patches will result in right</p>
              <SimpleTextEditor
                value={stringify(rightPatches)}
                readonly
              />
            </div>
          </div>
        </div>
        <div className="section">
          <h2>Three-way Merge Tool</h2>
          <p>Here you perform the three-way merge.</p>
          <div className="three-way-container">
            <div className="panel">
              <h3>Left</h3>
              <MonacoJsonHighlight
                targetDoc={
                  targetParseResult.error ? undefined : targetParseResult.value
                }
                doc={leftValue}
                patches={leftPatches}
                conflicts={conflicts}
                readonly
                onApply={handleApplyPatch}
                onDismiss={handleDismissPatch}
              />
            </div>
            <div className="panel">
              <h3>Result</h3>
              <SimpleTextEditor
                value={targetText}
                onChange={setTargetText}
              />
              {targetParseResult.error && (
                <ErrorMessage>
                  Error parsing patch: {formatResult(targetParseResult)}
                </ErrorMessage>
              )}
            </div>
            <div className="panel">
              <h3>Right</h3>
              <MonacoJsonHighlight
                targetDoc={
                  targetParseResult.error ? undefined : targetParseResult.value
                }
                doc={rightValue}
                patches={rightPatches}
                conflicts={conflicts}
                readonly
                onApply={handleApplyPatch}
                onDismiss={handleDismissPatch}
              />
            </div>
          </div>
        </div>
      </div>
      <style>{css`
        .section {
          display: flex;
          flex-direction: column;
          padding-bottom: 20px;
          border-bottom: 1px solid #ccc;
        }
        .three-way-container {
          display: flex;
          flex-wrap: nowrap;
          flex: 1;
        }
        .panel {
          display: flex;
          flex-direction: column;
          flex: 0.333333333;
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
