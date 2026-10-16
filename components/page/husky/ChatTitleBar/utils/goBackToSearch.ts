import type { useRouter } from 'next/navigation';

import type { IAiSearchReturn } from '@/components/types/aiSearchReturn';

import {
  AI_SEARCH_RETURN_KEY,
  HEADER_SEARCH_OPEN_PARAM,
  REOPEN_HEADER_SEARCH_EVENT,
} from '@/components/constants/aiSearchHandoff';
import { PAGE_ROUTES } from '@/utils/constants';

// The header search is the phone sheet below 960px (tablet-landscape) and the popover under the field above it.
const DESKTOP_SEARCH_FROM = 960;

function withSheetOpen(path: string) {
  const [pathname, query = ''] = path.split('?');
  const params = new URLSearchParams(query);
  params.set(HEADER_SEARCH_OPEN_PARAM, 'open');
  return `${pathname}?${params.toString()}`;
}

// Back to the page the member left for AI Search, with the header search open on the term they had typed.
export function goBackToSearch(router: ReturnType<typeof useRouter>) {
  const saved = sessionStorage.getItem(AI_SEARCH_RETURN_KEY);
  const { path, term }: IAiSearchReturn = saved ? JSON.parse(saved) : { path: PAGE_ROUTES.HOME, term: '' };

  router.push(window.innerWidth >= DESKTOP_SEARCH_FROM ? path : withSheetOpen(path));
  document.dispatchEvent(new CustomEvent(REOPEN_HEADER_SEARCH_EVENT, { detail: { term } }));
}
