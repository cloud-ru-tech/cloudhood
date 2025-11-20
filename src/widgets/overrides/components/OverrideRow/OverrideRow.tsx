import { useSortable } from '@dnd-kit/sortable';
import { useUnit } from 'effector-react/effector-react.mjs';
import { type KeyboardEvent, useState } from 'react';

import { ButtonFunction } from '@snack-uikit/button';
import { FieldText } from '@snack-uikit/fields';
import { CrossSVG } from '@snack-uikit/icons';
import { Checkbox, CheckboxProps } from '@snack-uikit/toggles';
import { Tooltip } from '@snack-uikit/tooltip';

import { $isPaused } from '#entities/is-paused/model';
import type { ResponseOverride } from '#entities/request-profile/types';
import { DragHandle } from '#entities/sortable-list';
import { selectedProfileResponseOverridesRemoved } from '#features/selected-profile-overrides/remove/model';
import { selectedProfileResponseOverridesUpdated } from '#features/selected-profile-overrides/update/model';

import * as S from './styled';

export function OverrideRow(props: ResponseOverride) {
  const { disabled, urlPattern, responseContent, id } = props;
  const { setNodeRef, listeners, attributes, transition, transform, isDragging } = useSortable({ id });
  const { isPaused } = useUnit({
    isPaused: $isPaused,
  });

  const [urlPatternFocused, setUrlPatternFocused] = useState(false);

  const onUrlPatternFocused = () => setUrlPatternFocused(true);
  const onUrlPatternBlur = () => setUrlPatternFocused(false);

  const handleKeyPress = (event: KeyboardEvent<HTMLInputElement>) => {
    const target = event.target as HTMLInputElement;
    const cursorPosition = target.selectionStart;
    if (event.key === ' ' && cursorPosition === 0) {
      event.preventDefault();
    }
  };

  const handleChange = (field: 'urlPattern' | 'responseContent') => (value: string) => {
    selectedProfileResponseOverridesUpdated([{ ...props, [field]: value }]);
  };

  const handleChecked: CheckboxProps['onChange'] = checked => {
    selectedProfileResponseOverridesUpdated([{ ...props, disabled: !checked }]);
  };

  return (
    <S.Wrapper ref={setNodeRef} transform={transform} transition={transition} isDragging={isDragging}>
      <S.LeftOverrideActions>
        <DragHandle disabled={isPaused} listeners={listeners} attributes={attributes} />

        <Checkbox
          data-test-id='response-override-checkbox'
          disabled={isPaused}
          checked={!disabled}
          onChange={handleChecked}
        />

        <Tooltip
          open={urlPatternFocused && urlPattern.length > 0}
          tip='URL pattern using URLPattern API syntax'
          placement='top'
        >
          <FieldText
            data-test-id='url-pattern-input'
            size='m'
            value={urlPattern}
            placeholder='URL pattern'
            onChange={handleChange('urlPattern')}
            onKeyDown={handleKeyPress}
            onFocus={onUrlPatternFocused}
            onBlur={onUrlPatternBlur}
            showClearButton={false}
            disabled={isPaused}
          />
        </Tooltip>
      </S.LeftOverrideActions>

      <FieldText
        size='m'
        value={responseContent}
        placeholder='Response content (JSON, text, etc.)'
        onChange={handleChange('responseContent')}
        onKeyDown={handleKeyPress}
        showClearButton={false}
        disabled={isPaused}
        data-test-id='response-content-input'
      />

      <ButtonFunction
        disabled={isPaused}
        size='s'
        data-test-id='remove-response-override-button'
        icon={<CrossSVG />}
        onClick={() => selectedProfileResponseOverridesRemoved([id])}
      />
    </S.Wrapper>
  );
}
