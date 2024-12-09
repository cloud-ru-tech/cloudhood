import { useUnit } from 'effector-react';

import { $isExportModalOpen, $isimportFromExtensionModalOpen, $isImportModalOpen } from '#entities/modal/model';

import { ExportModal } from './components/ExportModal';
import { ImportFromExtensionModal } from './components/ImportFromExtensionModal';
import { ImportModal } from './components/ImportModal';

export function Modals() {
  const [isImportModalOpen, isImportFromExtensionModalOpen, isExportModalOpen] = useUnit([
    $isImportModalOpen,
    $isimportFromExtensionModalOpen,
    $isExportModalOpen,
  ]);

  return (
    <>
      {isImportModalOpen && <ImportModal />}
      {isImportFromExtensionModalOpen && <ImportFromExtensionModal />}
      {isExportModalOpen && <ExportModal />}
    </>
  );
}
