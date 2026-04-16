import { useUnit } from 'effector-react';
import { useCallback, useMemo } from 'react';
import browser from 'webextension-polyfill';

import { DownloadSVG, PlusSVG, TrashSVG, UploadSVG } from '@snack-uikit/icons';

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

export function useActions({ onClose }: UseActionsProps) {
  const [isProfileRemoveAvailable, activeTab] = useUnit([$isProfileRemoveAvailable, $activeProfileActionsTab]);

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

  const handleExportDebugLogs = useCallback(() => {
    browser.runtime
      .sendMessage({ type: RuntimeMessageType.ExportDebugLogs })
      .then((response: unknown) => {
        const r = response as { ok?: boolean; result?: unknown } | undefined;
        if (!r?.ok || r.result == null) return;
        const content = JSON.stringify(r.result, null, 2);
        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        const a = document.createElement('a');
        a.href = window.URL.createObjectURL(blob);
        const now = new Date();
        const timestamp = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}_${now.getHours()}-${now.getMinutes()}-${now.getSeconds()}`;
        a.download = `Cloudhood_debug_logs_${timestamp}.txt`;
        a.click();
        window.URL.revokeObjectURL(a.href);
      })
      .catch(() => {});
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
      handleExportDebugLogs,
      handleExportModalOpened,
      handleOpenImportFromExtensionModal,
      handleOpenImportModal,
      handleRemoveProfile,
      isProfileRemoveAvailable,
      handleAddUrlFilter,
    ],
  );
}
