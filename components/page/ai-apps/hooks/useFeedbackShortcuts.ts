import { useEffect } from 'react';

import { isAnyDialogOpen, isOpenFeedbackKey, isShortcutsKey } from '../shortcutKeys';

interface Input {
  isEnabled: boolean;
  onOpenKey: () => void;
  /** Omitted where `?` belongs to the page rather than to this button. */
  onShortcutsKey?: () => void;
}

export function useFeedbackShortcuts(input: Input) {
  const { isEnabled, onOpenKey, onShortcutsKey } = input;

  useEffect(() => {
    if (!isEnabled) {
      return;
    }

    const onKey = (event: KeyboardEvent) => {
      if (onShortcutsKey && isShortcutsKey(event) && !isAnyDialogOpen()) {
        event.preventDefault();
        onShortcutsKey();
        return;
      }
      if (!isOpenFeedbackKey(event)) {
        return;
      }
      event.preventDefault();
      onOpenKey();
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isEnabled, onOpenKey, onShortcutsKey]);
}
