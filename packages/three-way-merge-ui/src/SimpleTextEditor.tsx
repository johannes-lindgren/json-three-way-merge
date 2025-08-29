import Editor from "@monaco-editor/react"

type Props = {
  value: string // current text
  onChange?: (value: string) => void // callback when user types
  readonly?: boolean
}

export default function SimpleTextEditor({ value, onChange, readonly }: Props) {
  return (
    <Editor
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
