import "./App.css";
import { MonacoJsonHighlight } from "./MonacoJsonHighlight.tsx";
import { useState } from "react";
import SimpleTextEditor from "./SimpleTextEditor.tsx";
import { chain, formatResult, parseJson } from "pure-parse";
import { parseJsonPatch } from "./JsonPatch.tsx";

const baseJson = {
  items: ["a", "b", "c"],
};

// Example patch to highlight: add "x" at index 1
const defaultPatch = {
  op: "add",
  path: "/items/1",
  value: "x",
};

function App() {
  const [patchText, setPatchText] = useState(
    JSON.stringify(defaultPatch, null, 2),
  );

  const patchResult = chain(parseJson, parseJsonPatch)(patchText);

  return (
    <>
      <h1>JSON Patch Highlight Example</h1>
      <h2>Patch</h2>
      <SimpleTextEditor value={patchText} onChange={setPatchText} />

      <h2>Left/Right</h2>
      {patchResult.error ? (
        <div style={{ color: "red" }}>
          Error parsing patch: {formatResult(patchResult)}
        </div>
      ) : (
        <MonacoJsonHighlight json={baseJson} patch={patchResult.value} />
      )}
    </>
  );
}

export default App;
