import { useState, useEffect, useCallback } from 'react';

export function useLocalStorageParam<T>(key: string, initialValue: T) {
  // Initialize state with the value from localStorage or the initial value
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window !== 'undefined') {
      const item = window.localStorage.getItem(key);

      return item ? (JSON.parse(item) as T) : initialValue;
    }

    return initialValue;
  });

  // Update the localStorage and state when the value changes
  const updateStoredValue = useCallback(
    (value: T) => {
      setStoredValue(value);

      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(value));
      }
    },
    [key],
  );

  // Sync the state with localStorage if it changes elsewhere
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === key) {
        setStoredValue(event.newValue ? (JSON.parse(event.newValue) as T) : initialValue);
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [key, initialValue]);

  return [storedValue, updateStoredValue] as const;
}
