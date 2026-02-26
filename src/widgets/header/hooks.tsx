import { useUnit } from 'effector-react';
import { useCallback, useMemo } from 'react';
import browser from 'webextension-polyfill';

import { DownloadSVG, PlusSVG, UploadSVG } from '@snack-uikit/icons';

import { exportModalOpened, importFromExtensionModalOpened, importModalOpened } from '#entities/modal/model';
import { $activeProfileActionsTab, profileActionsTabChanged } from '#entities/profile-actions';
import { profileAdded } from '#entities/request-profile/model';
import { profileUrlFiltersAdded } from '#features/selected-profile-url-filters/add/model';
import { FileOpenSVG, FileUploadSVG } from '#shared/assets/svg';
import { RuntimeMessageType } from '#shared/constants';

type UseActionsProps = {
  onClose(): void;
};

export function useActions({ onClose }: UseActionsProps) {
  const [
    activeTab,
    onProfileAdded,
    onImportModalOpened,
    onImportFromExtensionModalOpened,

    onExportModalOpened,
    onProfileUrlFiltersAdded,
    onProfileActionsTabChanged,
  ] = useUnit([
    $activeProfileActionsTab,
    profileAdded,
    importModalOpened,
    importFromExtensionModalOpened,
    exportModalOpened,
    profileUrlFiltersAdded,
    profileActionsTabChanged,
  ]);

  const handleAddProfile = useCallback(() => {
    onProfileAdded();
    onClose();
  }, [onClose, onProfileAdded]);

  const handleOpenImportModal = useCallback(() => {
    onImportModalOpened();
    onClose();
  }, [onClose, onImportModalOpened]);

  const handleOpenImportFromExtensionModal = useCallback(() => {
    onImportFromExtensionModalOpened();
    onClose();
  }, [onClose, onImportFromExtensionModalOpened]);

  const handleExportModalOpened = useCallback(() => {
    onExportModalOpened();
    onClose();
  }, [onClose, onExportModalOpened]);

  const handleAddUrlFilter = useCallback(() => {
    onProfileUrlFiltersAdded();
    if (activeTab !== 'url-filters') {
      onProfileActionsTabChanged('url-filters');
    }
    onClose();
  }, [onClose, activeTab, onProfileUrlFiltersAdded, onProfileActionsTabChanged]);

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
    ],
    [
      handleAddProfile,
      handleExportDebugLogs,
      handleExportModalOpened,
      handleOpenImportFromExtensionModal,
      handleOpenImportModal,
      handleAddUrlFilter,
    ],
  );
}
