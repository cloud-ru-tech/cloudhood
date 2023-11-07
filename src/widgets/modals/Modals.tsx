import { useUnit } from 'effector-react';

import { $isExportModalOpen, $isImportModalOpen } from '#entities/modal/model';

import { ExportModal } from './components/ExportModal';
import { ImportModal } from './components/ImportModal';

export function Modals() {
  const [isImportModalOpen, isExportModalOpen] = useUnit([$isImportModalOpen, $isExportModalOpen]);

  return (
    <>
      {isImportModalOpen && <ImportModal />}
      {isExportModalOpen && <ExportModal />}
    </>
  );
}
