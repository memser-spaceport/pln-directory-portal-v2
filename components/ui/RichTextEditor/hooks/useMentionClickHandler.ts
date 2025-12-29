import { useEffect, RefObject } from 'react';

interface UseMentionClickHandlerParams {
  enableMentions: boolean;
  editorContainerRef: RefObject<HTMLDivElement>;
  qlEditorClass: string;
}

/**
 * Hook to handle clicks on mention links to navigate to member profile
 */
export function useMentionClickHandler({
  enableMentions,
  editorContainerRef,
  qlEditorClass,
}: UseMentionClickHandlerParams) {
  useEffect(() => {
    if (!enableMentions || !editorContainerRef.current) {
      return;
    }

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const mentionLink = target.closest('.ql-mention') as HTMLAnchorElement;

      if (mentionLink && mentionLink.href) {
        e.preventDefault();
        e.stopPropagation();
        window.open(mentionLink.href, '_blank');
      }
    };

    const editorElement = editorContainerRef.current.querySelector(`.${qlEditorClass}`) as HTMLElement | null;

    if (editorElement) {
      editorElement.addEventListener('click', handleClick);
      return () => editorElement.removeEventListener('click', handleClick);
    }
  }, [enableMentions, editorContainerRef, qlEditorClass]);
}
