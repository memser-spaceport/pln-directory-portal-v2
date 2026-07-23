import { AiApp, AiAppFetchErrorKind, hasPrd } from '@/services/ai-apps/ai-apps.service';

export type PrdPageState =
  | { status: 'loading' }
  | { status: 'app-error'; errorKind: AiAppFetchErrorKind }
  | { status: 'no-prd' }
  | { status: 'prd-loading' }
  | { status: 'prd-error'; error: string }
  | { status: 'ready'; prd: string };

interface AppQuery {
  app: AiApp | null;
  errorKind: AiAppFetchErrorKind | null;
  isLoading: boolean;
}

interface PrdContentQuery {
  content: string | null;
  error: string | null;
  isLoading: boolean;
}

/**
 * Pure derivation over the two hooks' results — unit-testable without
 * rendering, and a missed case here is a TypeScript error rather than a
 * silent blank page.
 */
export function derivePrdPageState(appQuery: AppQuery, prdQuery: PrdContentQuery): PrdPageState {
  if (appQuery.isLoading) return { status: 'loading' };
  if (appQuery.errorKind) return { status: 'app-error', errorKind: appQuery.errorKind };
  if (!appQuery.app || !hasPrd(appQuery.app)) return { status: 'no-prd' };
  if (prdQuery.isLoading) return { status: 'prd-loading' };
  if (prdQuery.error || prdQuery.content === null) {
    return { status: 'prd-error', error: prdQuery.error ?? 'One-pager could not be loaded' };
  }
  return { status: 'ready', prd: prdQuery.content };
}
