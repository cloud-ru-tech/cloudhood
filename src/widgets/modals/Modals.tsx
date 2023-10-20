import { useUnit } from 'effector-react';
import React from 'react';

import { $isExportModalOpen } from '#entities/modal/model';

import { ExportModal } from './components/ExportModal';

export function Modals() {
  const [isExportModalOpen] = useUnit([$isExportModalOpen]);

  return <>{isExportModalOpen && <ExportModal />}</>;
}
