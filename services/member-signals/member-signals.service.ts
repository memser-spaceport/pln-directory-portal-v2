import { customFetch } from '@/utils/fetch-wrapper';
import { hasSession } from '@/utils/third-party.helper';
import type { IMemberSignal, MemberSignalEntityType } from '@/types/member-signals.types';

/**
 * Record a view or click of the logged-in member (LAB-3123). Fire-and-forget:
 * logged-out visitors send nothing (customFetch would sign them out), the
 * request outlives a same-tab navigation (`keepalive`), and every failure is
 * swallowed so the page never waits on or shows an error for it.
 */
export function recordMemberSignal(signal: IMemberSignal): void {
  if (!signal.entityId || !hasSession()) return;
  void customFetch(
    `${process.env.DIRECTORY_API_URL}/v1/member-signals`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(signal),
      keepalive: true,
    },
    true,
  ).catch(() => undefined);
}

const SEARCH_INDEX_ENTITY: Record<string, MemberSignalEntityType> = {
  members: 'member',
  teams: 'team',
  projects: 'project',
};

/** The signal entity type of a unified search result, or undefined for indexes that are not recorded (events, forum). */
export function searchIndexToEntityType(index: string | undefined): MemberSignalEntityType | undefined {
  return index ? SEARCH_INDEX_ENTITY[index] : undefined;
}
