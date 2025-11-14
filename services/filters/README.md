# Generic Filter Infrastructure

Reusable utilities for building consistent filter systems across different pages (Members, Teams, Projects, etc.).

## Overview

This infrastructure provides:
- **Generic Filter Store** - Zustand-based state management with URL synchronization
- **Auto Filter Counting** - Automatically count active filters
- **Type-Safe** - Full TypeScript support
- **Analytics Integration** - Built-in support for tracking filter changes
- **Backward Compatible** - Works with existing code

## Quick Start

### 1. Create a Filter Store

```typescript
import { createFilterStore } from '@/services/filters';

export const useMyPageFilterStore = createFilterStore({
  namespace: 'mypage',
  trackedParams: ['category', 'status', 'tags'],
  onFilterChange: (key, value, allParams) => {
    // Optional: Track analytics
    analytics.track('Filter Changed', { key, value });
  },
});
```

### 2. Use Filter Count

```typescript
import { useFilterCount } from '@/services/filters';
import { useMyPageFilterStore } from './store';

function MyComponent() {
  const filterCount = useFilterCount(useMyPageFilterStore, {
    excludeParams: ['sort', 'page'], // Don't count these
  });

  return <div>Active filters: {filterCount}</div>;
}
```

### 3. Use in Components

```typescript
function MyFilter() {
  const { params, setParam, clearParams } = useMyPageFilterStore();

  const category = params.get('category');

  return (
    <div>
      <button onClick={() => setParam('category', 'featured')}>
        Featured
      </button>
      <button onClick={() => clearParams()}>
        Clear All
      </button>
    </div>
  );
}
```

## API Reference

### `createFilterStore(config)`

Creates a Zustand store for filter management.

**Config Options:**
- `namespace` (string) - Identifier for the store (e.g., 'members', 'teams')
- `trackedParams` (string[]) - Array of param keys that should be tracked
- `onFilterChange` (optional) - Callback fired when filters change
- `analyticsDebounceMs` (optional) - Debounce time for analytics (default: 300ms)

**Returns:** A Zustand store hook with:
- `params` - URLSearchParams instance
- `setParam(key, value?)` - Set or delete a parameter
- `clearParams()` - Clear all parameters
- `setAllParams(params)` - Replace all parameters

### `useFilterCount(store, config)`

Automatically counts active filters.

**Arguments:**
- `store` - The filter store hook
- `config` (optional):
  - `excludeParams` - Array of param keys to exclude from count
  - `shouldCount` - Custom function to determine if param should count

**Returns:** Number of active filters

## Example: Migrating Existing Filters

### Before (Old Pattern)
```typescript
// Old: Manual Zustand store
export const useFilterStore = create<FilterState>((set, get) => ({
  params: new URLSearchParams(),
  setParam: (key, value) => {
    // ... lots of manual logic
    // ... analytics handling
    // ... debouncing
  },
  // ... more boilerplate
}));

// Old: Manual filter counting
export function useGetFilterCount() {
  const { params } = useFilterStore();

  return useMemo(() => {
    let count = 0;
    // Manually list all filter params
    let filterParams = ['param1', 'param2', 'param3'];
    filterParams.forEach((param) => {
      // Manual counting logic
    });
    return count;
  }, [params]);
}
```

### After (New Pattern)
```typescript
// New: Generic store factory
export const useFilterStore = createFilterStore({
  namespace: 'members',
  trackedParams: ['param1', 'param2', 'param3'],
  onFilterChange: (key, value, allParams) => {
    analytics.track('Filter Changed', { key, value });
  },
});

// New: Auto filter counting
export function useGetFilterCount() {
  return useFilterCount(useFilterStore, {
    excludeParams: ['sort', 'page'],
  });
}
```

## Benefits

✅ **80% less boilerplate** - No manual state management code
✅ **Consistent behavior** - Same patterns across all pages
✅ **Auto filter counting** - No manual param lists to maintain
✅ **Type-safe** - Full TypeScript support
✅ **Easy to extend** - Add new filters without touching store code
✅ **Analytics built-in** - Centralized tracking logic

## Migration Guide

See [MIGRATION.md](./MIGRATION.md) for step-by-step migration instructions.

## Current Usage

- ✅ **Members** - Fully migrated (services/members/store.ts)
- ⏳ **Teams** - Planned
- ⏳ **Projects** - Planned
- ⏳ **Demo Day** - Partially using (via members store)
