import { useEffect, RefObject } from 'react';
import { MentionDropdownRef } from '../MentionDropdown';

interface UseMentionKeyboardParams {
  isOpen: boolean;
  enableMentions: boolean;
  mentionDropdownRef: RefObject<MentionDropdownRef>;
  closeMentionDropdown: () => void;
}

/**
 * Hook to handle keyboard navigation for the mention dropdown
 */
export function useMentionKeyboard({
  isOpen,
  enableMentions,
  mentionDropdownRef,
  closeMentionDropdown,
}: UseMentionKeyboardParams) {
  useEffect(() => {
    if (!isOpen || !enableMentions) {
      return;
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (!mentionDropdownRef.current) {
        return;
      }

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          mentionDropdownRef.current.moveDown();
          break;
        case 'ArrowUp':
          e.preventDefault();
          mentionDropdownRef.current.moveUp();
          break;
        case 'Enter':
        case 'Tab':
          e.preventDefault();
          mentionDropdownRef.current.selectCurrent();
          break;
        case 'Escape':
          e.preventDefault();
          closeMentionDropdown();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, enableMentions, closeMentionDropdown, mentionDropdownRef]);
}
