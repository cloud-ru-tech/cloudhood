import { BrowserStorageKey } from '#shared/constants';
import { setWithBumpedHeadersConfigMeta } from '#shared/utils/headersConfigMeta';

export async function saveIsPausedToBrowserApi(isPaused: boolean) {
  await setWithBumpedHeadersConfigMeta({
    [BrowserStorageKey.IsPaused]: isPaused,
  });
}
