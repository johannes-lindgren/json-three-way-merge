// A helper for formatting CSS in a template literal
export const css = (strings: TemplateStringsArray, ...expr: any[]) =>
  String.raw(strings, ...expr)
