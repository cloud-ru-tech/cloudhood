import './json-editor.css';

import CodeMirror from '@uiw/react-codemirror';
import { useEffect, useMemo } from 'react';

import { getStyleNonce } from '#shared/utils/csp';

import * as S from './JsonEditor.styled';
import {
  applyJsonFormatOnBlur,
  createJsonEditorExtensions,
  isValidJsonDocument,
  JSON_EDITOR_BASIC_SETUP,
  type JsonEditorProps,
  resolveJsonEditorInvalid,
} from './jsonEditorModel';

export type { JsonEditorProps } from './jsonEditorModel';
export {
  applyJsonFormatOnBlur,
  formatJsonDocument,
  isValidJsonDocument,
  resolveJsonEditorInvalid,
} from './jsonEditorModel';

export function JsonEditor({
  value,
  onChange,
  onValidityChange,
  disabled = false,
  invalid,
  hint,
  autoFormatOnBlur = true,
  className,
  'data-test-id': dataTestId,
}: JsonEditorProps) {
  const extensions = useMemo(() => createJsonEditorExtensions(getStyleNonce()), []);
  const isInvalid = resolveJsonEditorInvalid(value, invalid);

  useEffect(() => {
    onValidityChange?.(isValidJsonDocument(value));
  }, [onValidityChange, value]);

  const handleBlur = () => {
    if (!autoFormatOnBlur || disabled) {
      return;
    }

    applyJsonFormatOnBlur(value, onChange);
  };

  return (
    <S.Root className={className} data-disabled={disabled} data-test-id={dataTestId}>
      <S.EditorFrame className='cloudhood-json-editor' data-invalid={isInvalid}>
        <CodeMirror
          value={value}
          onChange={onChange}
          onBlur={handleBlur}
          editable={!disabled}
          readOnly={disabled}
          indentWithTab
          basicSetup={JSON_EDITOR_BASIC_SETUP}
          theme='none'
          extensions={extensions}
        />
      </S.EditorFrame>
      {hint ? <S.Hint>{hint}</S.Hint> : null}
    </S.Root>
  );
}
