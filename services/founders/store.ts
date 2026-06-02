import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { DEFAULT_VISIBLE_COLUMNS, FOUNDER_DB_COLUMNS_STORAGE_KEY } from './constants';

type FounderColumnStore = {
  visibleColumns: string[];
  setVisibleColumns: (cols: string[]) => void;
  toggleColumn: (col: string) => void;
};

export const useFounderColumnStore = create<FounderColumnStore>()(
  persist(
    (set) => ({
      visibleColumns: DEFAULT_VISIBLE_COLUMNS,
      setVisibleColumns: (cols) => set({ visibleColumns: cols }),
      toggleColumn: (col) =>
        set((s) => ({
          visibleColumns: s.visibleColumns.includes(col)
            ? s.visibleColumns.filter((c) => c !== col)
            : [...s.visibleColumns, col],
        })),
    }),
    { name: FOUNDER_DB_COLUMNS_STORAGE_KEY },
  ),
);
