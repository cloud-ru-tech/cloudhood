import { useUnit } from 'effector-react';
import { useCallback, useMemo } from 'react';

import { DownloadSVG, PlusSVG, TrashSVG, UploadSVG } from '@snack-uikit/icons';

import { exportModalOpened, importFromExtensionModalOpened, importModalOpened } from '#entities/modal/model';
import { $isProfileRemoveAvailable, profileAdded } from '#entities/request-profile/model';
import { selectedProfileRemoved } from '#features/selected-profile/remove/model';
import { profileUrlFiltersAdded } from '#features/selected-profile-url-filters/add/model';
import { FileOpenSVG, FileUploadSVG } from '#shared/assets/svg';

type UseActionsProps = {
  onClose(): void;
};

export function useActions({ onClose }: UseActionsProps) {
  const [isProfileRemoveAvailable] = useUnit([$isProfileRemoveAvailable]);

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
    ],
  );
}
