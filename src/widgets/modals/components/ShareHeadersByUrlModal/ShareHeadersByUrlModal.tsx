import { useUnit } from 'effector-react';
import { useCallback, useState } from 'react';

import { FieldText, FieldTextArea } from '@snack-uikit/fields';
import { Modal } from '@snack-uikit/modal';

import { shareHeadersByUrlModalClosed } from '#entities/modal/model';
import { notificationAdded } from '#entities/notification/model';
import { NotificationVariant } from '#entities/notification/types';
import { $selectedProfileRequestHeaders } from '#entities/request-profile/model';
import { createSharedHeadersUrl } from '#features/share-headers-by-url';

import * as S from './styled';

export function ShareHeadersByUrlModal() {
  const [domain, setDomain] = useState('');
  const [link, setLink] = useState('');
  const [error, setError] = useState<string>();
  const [requestHeaders, handleClose, notify] = useUnit([
    $selectedProfileRequestHeaders,
    shareHeadersByUrlModalClosed,
    notificationAdded,
  ]);

  const handleDomainChange = useCallback((value: string) => {
    setDomain(value);
    setLink('');
    setError(undefined);
  }, []);

  const handleCreateAndCopy = useCallback(async () => {
    let generatedLink: string;

    try {
      generatedLink = createSharedHeadersUrl(domain, requestHeaders);
      setLink(generatedLink);
      setError(undefined);
    } catch (generationError) {
      setError(generationError instanceof Error ? generationError.message : 'Unable to create a sharing link');
      return;
    }

    try {
      await navigator.clipboard.writeText(generatedLink);
      notify({ message: 'Sharing link copied to clipboard', variant: NotificationVariant.ImportProfileSuccess });
    } catch {
      notify({ message: 'Unable to copy the sharing link', variant: NotificationVariant.ImportProfileError });
    }
  }, [domain, notify, requestHeaders]);

  return (
    <Modal
      open
      onClose={handleClose}
      title='Share headers by URL'
      approveButton={{
        onClick: handleCreateAndCopy,
        label: link ? 'Copy link' : 'Create and copy link',
      }}
      cancelButton={{ onClick: handleClose, label: 'Close' }}
      content={
        <S.Wrapper>
          <FieldText
            label='Domain'
            placeholder='example.com'
            inputMode='url'
            value={domain}
            onChange={handleDomainChange}
            size='m'
            showClearButton={false}
            error={error}
            data-test-id='share-headers-domain-input'
          />

          {link && (
            <FieldTextArea
              label='Link'
              value={link}
              onChange={() => undefined}
              minRows={3}
              maxRows={3}
              size='m'
              readonly
              data-test-id='share-headers-link-output'
            />
          )}
        </S.Wrapper>
      }
    />
  );
}
