import { useUnit } from 'effector-react';
import { useCallback, useMemo } from 'react';

import { DownloadSVG, PlusSVG, TrashSVG, UploadSVG } from '@snack-uikit/icons';

import { exportModalOpened, importFromExtensionModalOpened, importModalOpened } from '#entities/modal/model';
import { $activeProfileActionsTab, profileActionsTabChanged } from '#entities/profile-actions';
import { $isProfileRemoveAvailable, profileAdded } from '#entities/request-profile/model';
import { selectedProfileRemoved } from '#features/selected-profile/remove/model';
import { profileUrlFiltersAdded } from '#features/selected-profile-url-filters/add/model';
import { FileOpenSVG, FileUploadSVG } from '#shared/assets/svg';

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
    isProfileRemoveAvailable,
    onProfileRemoved,
  ] = useUnit([
    $activeProfileActionsTab,
    profileAdded,
    importModalOpened,
    importFromExtensionModalOpened,
    exportModalOpened,
    profileUrlFiltersAdded,
    profileActionsTabChanged,
    $isProfileRemoveAvailable,
    selectedProfileRemoved,
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

  const handleRemoveProfile = useCallback(() => {
    if (!isProfileRemoveAvailable) {
      return;
    }

    onProfileRemoved();
    onClose();
  }, [isProfileRemoveAvailable, onClose, onProfileRemoved]);

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
        id: 'remove-profile',
        content: { option: 'Delete profile' },
        beforeContent: <TrashSVG />,
        disabled: !isProfileRemoveAvailable,
        onClick: handleRemoveProfile,
      },
    ],
    [
      handleAddProfile,
      handleExportModalOpened,
      handleOpenImportFromExtensionModal,
      handleOpenImportModal,
      handleAddUrlFilter,
      handleRemoveProfile,
      isProfileRemoveAvailable,
    ],
  );
}
