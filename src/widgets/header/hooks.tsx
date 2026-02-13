import { useUnit } from 'effector-react';
import { useCallback, useMemo } from 'react';
import browser from 'webextension-polyfill';

import { CheckSVG, DownloadSVG, PlusSVG, TrashSVG, UploadSVG } from '@snack-uikit/icons';

import { $mirrorLogsToPageConsole, mirrorLogsToPageConsoleToggled } from '#entities/mirror-logs/model';
import { exportModalOpened, importFromExtensionModalOpened, importModalOpened } from '#entities/modal/model';
import { $activeProfileActionsTab, profileActionsTabChanged } from '#entities/profile-actions';
import { $isProfileRemoveAvailable, profileAdded } from '#entities/request-profile/model';
import { selectedProfileRemoved } from '#features/selected-profile/remove/model';
import { profileUrlFiltersAdded } from '#features/selected-profile-url-filters/add/model';
import { FileOpenSVG, FileUploadSVG } from '#shared/assets/svg';
import { RuntimeMessageType } from '#shared/constants';

type UseActionsProps = {
  onClose(): void;
};

type ExportDebugLogsResponse =
  | { ok: true; result: unknown }
  | { ok: false; error?: string };

export function useActions({ onClose }: UseActionsProps) {
  const [isProfileRemoveAvailable, activeTab, mirrorLogsToPageConsole] = useUnit([
    $isProfileRemoveAvailable,
    $activeProfileActionsTab,
    $mirrorLogsToPageConsole,
  ]);

  const handleAddProfile = useCallback(() => {
    profileAdded();
    onClose();
  }, [onClose]);

  const handleOpenImportModal = useCallback(() => {
    importModalOpened();
    onClose();
  }, [onClose]);

  const handleOpenImportFromExtensionModal = useCallback(() => {
    importFromExtensionModalOpened();
    onClose();
  }, [onClose]);

  const handleRemoveProfile = useCallback(() => {
    selectedProfileRemoved();
    onClose();
  }, [onClose]);

  const handleExportModalOpened = useCallback(() => {
    exportModalOpened();
    onClose();
  }, [onClose]);

  const handleAddUrlFilter = useCallback(() => {
    profileUrlFiltersAdded();
    if (activeTab !== 'url-filters') {
      profileActionsTabChanged('url-filters');
    }
    onClose();
  }, [onClose, activeTab]);

  const handleToggleMirrorLogsToPageConsole = useCallback(() => {
    mirrorLogsToPageConsoleToggled();
    onClose();
  }, [onClose]);

  const handleExportDebugLogs = useCallback(() => {
    (browser.runtime.sendMessage({
        type: RuntimeMessageType.ExportDebugLogs,
      }) as Promise<ExportDebugLogsResponse | undefined>)
      .then(response => {
        if (!response?.ok || response.result == null) return;

        const exportBody = JSON.stringify(response.result, null, 2);
        const blob = new Blob([exportBody], { type: 'text/plain;charset=utf-8' });
        const a = document.createElement('a');
        a.href = window.URL.createObjectURL(blob);
        const now = new Date();
        const ts = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}_${now.getHours()}-${now.getMinutes()}-${now.getSeconds()}`;
        a.download = `Cloudhood_debug_logs_${ts}.txt`;
        a.click();
        window.URL.revokeObjectURL(a.href);
      })
      .catch(() => undefined);
    onClose();
  }, [onClose]);

  return useMemo(
    () => [
      {
        id: 'add',
        content: { option: 'Add profile' },
        beforeContent: <PlusSVG />,
        onClick: handleAddProfile,
      },
      {
        id: 'import',
        content: { option: 'Import profile' },
        beforeContent: <DownloadSVG />,
        onClick: handleOpenImportModal,
      },
      {
        id: 'import-from-extension',
        content: { option: 'Import from other extension' },
        beforeContent: <FileOpenSVG />,
        onClick: handleOpenImportFromExtensionModal,
      },
      {
        id: 'add-request-url-filter',
        content: { option: 'Add request URL filters' },
        beforeContent: <FileUploadSVG />,
        onClick: handleAddUrlFilter,
      },
      {
        id: 'export',
        content: { option: 'Export/share profile' },
        beforeContent: <UploadSVG />,
        onClick: handleExportModalOpened,
      },
      {
        id: 'mirror-logs-page-console',
        content: {
          option: `Mirror logs to page console (${mirrorLogsToPageConsole ? 'On' : 'Off'})`,
        },
        beforeContent: mirrorLogsToPageConsole ? <CheckSVG /> : undefined,
        onClick: handleToggleMirrorLogsToPageConsole,
      },
      {
        id: 'export-debug-logs',
        content: { option: 'Export debug logs' },
        beforeContent: <DownloadSVG />,
        onClick: handleExportDebugLogs,
      },
      {
        id: 'remove',
        content: { option: 'Delete profile' },
        beforeContent: <TrashSVG />,
        onClick: handleRemoveProfile,
        disabled: !isProfileRemoveAvailable,
      },
    ],
    [
      handleAddProfile,
      handleExportModalOpened,
      handleOpenImportFromExtensionModal,
      handleOpenImportModal,
      handleRemoveProfile,
      isProfileRemoveAvailable,
      handleAddUrlFilter,
      handleToggleMirrorLogsToPageConsole,
      mirrorLogsToPageConsole,
      handleExportDebugLogs,
    ],
  );
}
