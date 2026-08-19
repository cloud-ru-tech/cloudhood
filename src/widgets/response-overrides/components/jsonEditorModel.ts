import { json } from '@codemirror/lang-json';
import { indentUnit, syntaxHighlighting } from '@codemirror/language';
import { EditorState, type Extension } from '@codemirror/state';
import { EditorView } from '@codemirror/view';
import { classHighlighter } from '@lezer/highlight';

export type JsonEditorProps = {
  value: string;
  onChange: (value: string) => void;
  onValidityChange?: (isValid: boolean) => void;
  disabled?: boolean;
  invalid?: boolean;
  hint?: string;
  autoFormatOnBlur?: boolean;
  className?: string;
  'data-test-id'?: string;
};

export const JSON_EDITOR_BASIC_SETUP = {
  lineNumbers: false,
  highlightActiveLineGutter: false,
  foldGutter: false,
  dropCursor: false,
  allowMultipleSelections: false,
  indentOnInput: true,
  syntaxHighlighting: false,
  bracketMatching: true,
  closeBrackets: true,
  autocompletion: false,
  rectangularSelection: false,
  crosshairCursor: false,
  highlightActiveLine: false,
  highlightSelectionMatches: false,
  closeBracketsKeymap: true,
  searchKeymap: false,
  foldKeymap: false,
  completionKeymap: false,
  lintKeymap: false,
  tabSize: 2,
} as const;

export const JSON_EDITOR_TOKEN_CLASSES = [
  'tok-propertyName',
  'tok-string',
  'tok-number',
  'tok-bool',
  'tok-atom',
  'tok-keyword',
  'tok-punctuation',
  'tok-invalid',
] as const;

export function isValidJsonDocument(value: string): boolean {
  try {
    JSON.parse(value);
    return true;
  } catch {
    return false;
  }
}

export function formatJsonDocument(value: string): string | null {
  try {
    const parsed: unknown = JSON.parse(value);
    return JSON.stringify(parsed, null, 2);
  } catch {
    return null;
  }
}

export function resolveJsonEditorInvalid(value: string, invalid?: boolean): boolean {
  if (typeof invalid === 'boolean') {
    return invalid;
  }

  return !isValidJsonDocument(value);
}

export function applyJsonFormatOnBlur(value: string, onChange: (nextValue: string) => void): boolean {
  const formatted = formatJsonDocument(value);

  if (formatted === null || formatted === value) {
    return false;
  }

  onChange(formatted);
  return true;
}

export function createJsonEditorExtensions(styleNonce: string): Extension[] {
  return [
    EditorView.cspNonce.of(styleNonce),
    json(),
    syntaxHighlighting(classHighlighter),
    EditorView.lineWrapping,
    EditorState.tabSize.of(2),
    indentUnit.of('  '),
  ];
}
