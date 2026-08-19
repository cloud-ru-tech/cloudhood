import { language } from '@codemirror/language';
import { EditorState } from '@codemirror/state';
import { EditorView } from '@codemirror/view';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it, vi } from 'vitest';

import {
  applyJsonFormatOnBlur,
  createJsonEditorExtensions,
  formatJsonDocument,
  isValidJsonDocument,
  JSON_EDITOR_TOKEN_CLASSES,
  resolveJsonEditorInvalid,
} from '../jsonEditorModel';

const STYLE_NONCE = 'cloudhood-extension-style-nonce';

const cssSource = readFileSync(join(dirname(fileURLToPath(import.meta.url)), '../json-editor.css'), 'utf8');

describe('isValidJsonDocument', () => {
  it('accepts parseable JSON including empty objects and literals', () => {
    expect(isValidJsonDocument('{}')).toBe(true);
    expect(isValidJsonDocument('[]')).toBe(true);
    expect(isValidJsonDocument('null')).toBe(true);
    expect(isValidJsonDocument('{"a":1}')).toBe(true);
  });

  it('rejects empty, truncated, or trailing-junk JSON', () => {
    expect(isValidJsonDocument('')).toBe(false);
    expect(isValidJsonDocument('{')).toBe(false);
    expect(isValidJsonDocument('{"a":1} trailing')).toBe(false);
  });
});

describe('formatJsonDocument', () => {
  it('pretty-prints valid JSON with two-space indent without mutating the input', () => {
    const compact = '{"a":1,"b":[true,null]}';
    expect(formatJsonDocument(compact)).toBe('{\n  "a": 1,\n  "b": [\n    true,\n    null\n  ]\n}');
    expect(compact).toBe('{"a":1,"b":[true,null]}');
  });

  it('returns null for invalid JSON so callers can leave the draft untouched', () => {
    expect(formatJsonDocument('{')).toBeNull();
    expect(formatJsonDocument('')).toBeNull();
  });
});

describe('resolveJsonEditorInvalid', () => {
  it('derives invalid from JSON.parse when the card does not override', () => {
    expect(resolveJsonEditorInvalid('{}')).toBe(false);
    expect(resolveJsonEditorInvalid('{')).toBe(true);
  });

  it('lets the card force the error visual independently of parseability', () => {
    expect(resolveJsonEditorInvalid('{}', true)).toBe(true);
    expect(resolveJsonEditorInvalid('{', false)).toBe(false);
  });
});

describe('applyJsonFormatOnBlur', () => {
  it('formats valid compact JSON and reports that onChange ran', () => {
    const onChange = vi.fn();

    expect(applyJsonFormatOnBlur('{"a":1}', onChange)).toBe(true);
    expect(onChange).toHaveBeenCalledWith('{\n  "a": 1\n}');
  });

  it('does not call onChange for invalid or already-formatted JSON', () => {
    const onChange = vi.fn();
    const formatted = '{\n  "a": 1\n}';

    expect(applyJsonFormatOnBlur('{', onChange)).toBe(false);
    expect(applyJsonFormatOnBlur(formatted, onChange)).toBe(false);
    expect(onChange).not.toHaveBeenCalled();
  });
});

describe('createJsonEditorExtensions', () => {
  it('applies the Emotion style nonce so CodeMirror style tags match CSP', () => {
    const state = EditorState.create({
      doc: '{}',
      extensions: createJsonEditorExtensions(STYLE_NONCE),
    });

    expect(state.facet(EditorView.cspNonce)).toBe(STYLE_NONCE);
  });

  it('enables JSON language, wrapping, and two-space indent', () => {
    const extensions = createJsonEditorExtensions(STYLE_NONCE);
    const state = EditorState.create({
      doc: '{}',
      extensions,
    });

    expect(state.facet(language)?.name).toBe('json');
    expect(state.tabSize).toBe(2);
    expect(extensions).toContain(EditorView.lineWrapping);
  });
});

describe('highlight-safe token CSS', () => {
  it('styles classHighlighter token classes in bundled CSS instead of inline colors', () => {
    for (const tokenClass of JSON_EDITOR_TOKEN_CLASSES) {
      expect(cssSource).toContain(`.${tokenClass}`);
    }

    expect(cssSource.includes('style=')).toBe(false);
  });
});
