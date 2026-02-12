import { useEffect, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

export function useEditSectionParam(sectionId: string, onEdit: () => void) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const triggered = useRef(false);

  useEffect(() => {
    if (triggered.current) return;

    const editSection = searchParams.get('editSection');
    if (editSection === sectionId) {
      triggered.current = true;
      onEdit();

      const params = new URLSearchParams(searchParams.toString());
      params.delete('editSection');
      const newSearch = params.toString();
      router.replace(`${window.location.pathname}${newSearch ? `?${newSearch}` : ''}`, { scroll: false });
    }
  }, [searchParams, sectionId, onEdit, router]);
}
