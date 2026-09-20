import { useEffect, useState } from 'react';

/**
 * The trailing edge of `value`, `delay` ms after it stops changing.
 *
 * The dialog keeps the *raw* term in state — the field, the AI row's label and
 * everything the user submits read that, so they can never lag behind what is
 * on screen. Only the search query reads this. Splitting them that way is what
 * removes a whole class of debounce bug: production's `DebouncedInput` holds
 * its own copy of the value and publishes it 700ms later, so pressing the AI
 * row (or Enter) a moment after the last keystroke asked about a truncated
 * term, and clearing the field could be undone 400ms later by a timer that was
 * already in flight. With one source of truth and the delay on the *derived*
 * value, neither is expressible.
 */
export function useDebouncedValue<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);

  return debounced;
}
