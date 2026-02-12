import { useEffect } from 'react';

const EDIT_SECTION_EVENT = 'open-edit-section';

export function dispatchEditSection(sectionId: string) {
  window.dispatchEvent(new CustomEvent(EDIT_SECTION_EVENT, { detail: sectionId }));
}

export function useEditSectionListener(sectionId: string, onEdit: () => void) {
  useEffect(() => {
    function handler(e: Event) {
      if ((e as CustomEvent).detail === sectionId) {
        onEdit();
      }
    }

    window.addEventListener(EDIT_SECTION_EVENT, handler);
    return () => window.removeEventListener(EDIT_SECTION_EVENT, handler);
  }, [sectionId, onEdit]);
}
