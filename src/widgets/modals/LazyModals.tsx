import { useUnit } from 'effector-react';
import { lazy, Suspense } from 'react';

import {
  $isExportModalOpen,
  $isimportFromExtensionModalOpen,
  $isImportModalOpen,
  $isRemoveAllResponseOverridesModalOpen,
} from '#entities/modal/model';

const ExportModal = lazy(() => import('./components/ExportModal').then(m => ({ default: m.ExportModal })));
const ImportFromExtensionModal = lazy(() =>
  import('./components/ImportFromExtensionModal').then(m => ({ default: m.ImportFromExtensionModal })),
);
const ImportModal = lazy(() => import('./components/ImportModal').then(m => ({ default: m.ImportModal })));
const RemoveAllResponseOverridesModal = lazy(() =>
  import('./components/RemoveAllResponseOverridesModal').then(m => ({ default: m.RemoveAllResponseOverridesModal })),
);

export function LazyModals() {
  const [isImportModalOpen, isImportFromExtensionModalOpen, isExportModalOpen, isRemoveAllResponseOverridesModalOpen] =
    useUnit([
      $isImportModalOpen,
      $isimportFromExtensionModalOpen,
      $isExportModalOpen,
      $isRemoveAllResponseOverridesModalOpen,
    ]);

  return (
    <>
      {isImportModalOpen && (
        <Suspense fallback={null}>
          <ImportModal />
        </Suspense>
      )}
      {isImportFromExtensionModalOpen && (
        <Suspense fallback={null}>
          <ImportFromExtensionModal />
        </Suspense>
      )}
      {isExportModalOpen && (
        <Suspense fallback={null}>
          <ExportModal />
        </Suspense>
      )}
      {isRemoveAllResponseOverridesModalOpen && (
        <Suspense fallback={null}>
          <RemoveAllResponseOverridesModal />
        </Suspense>
      )}
    </>
  );
}
