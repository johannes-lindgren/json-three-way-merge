import Editor, { type OnMount } from '@monaco-editor/react'
import { useCallback } from 'react'

type SimpleTextEditorProps = {
  value: string // current text
  onChange?: (value: string) => void // callback when user types
  readonly?: boolean
  onMount?: OnMount
}

export default function SimpleTextEditor(props: SimpleTextEditorProps) {
  const { value, onChange, readonly } = props

  const handleMount: OnMount = useCallback(
    (editor, monaco) => {
      props.onMount?.(editor, monaco)
    },
    [props],
  )

  return (
    <Editor
      onMount={handleMount}
      height="400px"
      defaultLanguage="json"
      value={value} // controlled from props
      onChange={(val) => val && onChange?.(val)}
      options={{
        readOnly: readonly,
        minimap: { enabled: false },
        fontSize: 14,
      }}
    />
  )
}
