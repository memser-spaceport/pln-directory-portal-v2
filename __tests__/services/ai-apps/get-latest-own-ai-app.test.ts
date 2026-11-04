import type { AiApp } from '@/services/ai-apps/ai-apps.service';
import { getLatestOwnAiApp } from '@/services/ai-apps/utils/getLatestOwnAiApp';

const app = (uid: string, memberUid: string, updatedAt: string) =>
  ({ uid, memberUid, name: `App ${uid}`, updatedAt }) as AiApp;

describe('getLatestOwnAiApp (LAB-3136)', () => {
  const apps = [
    app('a', 'me', '2026-11-01T10:00:00Z'),
    app('b', 'other', '2026-11-04T10:00:00Z'),
    app('c', 'me', '2026-11-03T10:00:00Z'),
    app('d', 'me', '2026-10-30T10:00:00Z'),
  ];

  it('returns the member’s own most recently updated app', () => {
    expect(getLatestOwnAiApp(apps, 'me')?.uid).toBe('c');
  });

  it('does not count apps by other members that the list shows', () => {
    expect(getLatestOwnAiApp([app('b', 'other', '2026-11-04T10:00:00Z')], 'me')).toBeNull();
  });

  it('returns null with no apps or no member', () => {
    expect(getLatestOwnAiApp([], 'me')).toBeNull();
    expect(getLatestOwnAiApp(apps, undefined)).toBeNull();
    expect(getLatestOwnAiApp(apps, null)).toBeNull();
  });
});
