import { useUnit } from 'effector-react';
import { useCallback, useMemo } from 'react';

import { DownloadSVG, PlusSVG, UploadSVG } from '@snack-uikit/icons';

import { exportModalOpened, importFromExtensionModalOpened, importModalOpened } from '#entities/modal/model';
import { $activeProfileActionsTab, profileActionsTabChanged } from '#entities/profile-actions';
import { profileAdded } from '#entities/request-profile/model';
import { profileUrlFiltersAdded } from '#features/selected-profile-url-filters/add/model';
import { FileOpenSVG, FileUploadSVG } from '#shared/assets/svg';

type UseActionsProps = {
  onClose(): void;
};

export function useActions({ onClose }: UseActionsProps) {
  const [activeTab] = useUnit([$activeProfileActionsTab]);

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
    ],
    [
      handleAddProfile,
      handleExportModalOpened,
      handleOpenImportFromExtensionModal,
      handleOpenImportModal,
      handleAddUrlFilter,
    ],
  );
}
