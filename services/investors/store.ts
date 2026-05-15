import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { OutreachInvestor } from './types';
import { COLUMN_PRESETS, ColumnPresetKey, DEFAULT_VISIBLE_COLUMNS } from './constants';

// Style note (per code-style-from-team.md): Zustand stores keep state fields
// readonly at the top level and put mutators under an `actions: {}` namespace.
// Consumers: `const { actions } = useStore()` then `actions.setX(...)` — or
// select individual actions for fine-grained re-renders.

interface DrawerState {
  readonly selectedInvestorId: string | null;
  readonly actions: {
    open: (id: string) => void;
    close: () => void;
  };
}

export const useInvestorDrawerStore = create<DrawerState>((set) => ({
  selectedInvestorId: null,
  actions: {
    open: (id) => set({ selectedInvestorId: id }),
    close: () => set({ selectedInvestorId: null }),
  },
}));

interface ColumnState {
  readonly preset: ColumnPresetKey;
  readonly visibleColumns: string[];
  readonly actions: {
    setPreset: (preset: ColumnPresetKey) => void;
    setVisibleColumns: (cols: string[]) => void;
    toggleColumn: (col: string) => void;
    resetToPreset: () => void;
  };
}

export const useInvestorColumnStore = create<ColumnState>()(
  persist(
    (set, get) => ({
      preset: 'outreach',
      visibleColumns: DEFAULT_VISIBLE_COLUMNS,
      actions: {
        setPreset: (preset) => set({ preset, visibleColumns: [...COLUMN_PRESETS[preset]] }),
        setVisibleColumns: (visibleColumns) => set({ visibleColumns }),
        toggleColumn: (col) => {
          const cur = get().visibleColumns;
          set({
            visibleColumns: cur.includes(col) ? cur.filter((c) => c !== col) : [...cur, col],
          });
        },
        resetToPreset: () => {
          const { preset } = get();
          set({ visibleColumns: [...COLUMN_PRESETS[preset]] });
        },
      },
    }),
    {
      // Bumped to v2 to discard stale defaults cached from earlier prototype
      // (old list included `tags`, `lab_os_profile`, etc. as defaults).
      name: 'investor_db.columns.v2',
      storage: createJSONStorage(() => localStorage),
      // Don't persist action functions
      partialize: (state) => ({ preset: state.preset, visibleColumns: state.visibleColumns }) as never,
    },
  ),
);

// Mock-only mutation overlay: V1 "Tag" action hydrates optimistically without
// a real backend. (Note + engagement-tier mutations were dropped from the
// action list — those are Affinity's job, not ours.) Persists to localStorage
// so tagging survives reload during the prototype.
interface MutationOverlayState {
  readonly overrides: Record<string, Partial<OutreachInvestor>>;
  readonly actions: {
    applyOverride: (id: string, patch: Partial<OutreachInvestor>) => void;
    addTag: (id: string, tag: string) => void;
    removeTag: (id: string, tag: string) => void;
    clear: () => void;
  };
}

export const useInvestorMutationOverlay = create<MutationOverlayState>()(
  persist(
    (set, get) => ({
      overrides: {},
      actions: {
        applyOverride: (id, patch) =>
          set((s) => ({
            overrides: {
              ...s.overrides,
              [id]: { ...(s.overrides[id] ?? {}), ...patch },
            },
          })),
        addTag: (id, tag) => {
          const trimmed = tag.trim();
          if (!trimmed) return;
          const cur = get().overrides[id]?.tags ?? [];
          if (cur.includes(trimmed)) return;
          get().actions.applyOverride(id, { tags: [...cur, trimmed] });
        },
        removeTag: (id, tag) => {
          const cur = get().overrides[id]?.tags ?? [];
          get().actions.applyOverride(id, { tags: cur.filter((t) => t !== tag) });
        },
        clear: () => set({ overrides: {} }),
      },
    }),
    {
      name: 'investor_db.mutations.v1',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ overrides: state.overrides }) as never,
    },
  ),
);

// Saved views (user-created, persisted locally for V1; backend ask Phase 2).
type StoredSavedView = {
  id: string;
  name: string;
  tab: string;
  params: Record<string, unknown>;
  created_at: string;
};

interface SavedViewsState {
  readonly views: StoredSavedView[];
  readonly actions: {
    saveView: (name: string, tab: string, params: Record<string, unknown>) => void;
    deleteView: (id: string) => void;
  };
}

export const useSavedViewsStore = create<SavedViewsState>()(
  persist(
    (set) => ({
      views: [],
      actions: {
        saveView: (name, tab, params) =>
          set((s) => ({
            views: [
              ...s.views,
              {
                id: `view-${Date.now()}`,
                name,
                tab,
                params,
                created_at: new Date().toISOString(),
              },
            ],
          })),
        deleteView: (id) =>
          set((s) => ({
            views: s.views.filter((v) => v.id !== id),
          })),
      },
    }),
    {
      name: 'investor_db.saved_views.v1',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ views: state.views }) as never,
    },
  ),
);

/** Helper: merge mock overlay patches into raw investor records. */
export function applyOverlayToInvestor<T extends OutreachInvestor>(
  inv: T,
  overrides: Record<string, Partial<OutreachInvestor>>,
): T {
  const patch = overrides[inv.investor_id];
  return patch ? { ...inv, ...patch, tags: patch.tags ?? inv.tags } : inv;
}
