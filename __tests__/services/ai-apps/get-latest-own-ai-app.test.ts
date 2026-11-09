import type { AiApp } from '@/services/ai-apps/ai-apps.service';
import { getLatestOwnAiApp } from '@/services/ai-apps/utils/getLatestOwnAiApp';

/** List shape: the API drops `memberUid` and records the creator on `member.uid`. */
const app = (uid: string, creatorUid: string, updatedAt: string) =>
  ({
    uid,
    name: `App ${uid}`,
    updatedAt,
    member: { uid: creatorUid, name: creatorUid, image: null },
  }) as AiApp;

describe('getLatestOwnAiApp (LAB-3136)', () => {
  const sessionUid = 'me';
  const apps = [
    app('a', sessionUid, '2026-11-01T10:00:00Z'),
    app('b', 'other', '2026-11-04T10:00:00Z'),
    app('c', sessionUid, '2026-11-03T10:00:00Z'),
    app('d', sessionUid, '2026-10-30T10:00:00Z'),
  ];

  it('treats a signed-in member as having apps when their session identity matches the creator', () => {
    expect(getLatestOwnAiApp(apps, sessionUid)?.uid).toBe('c');
  });

  it('does not count apps by other members that the list shows', () => {
    const someoneElses = {
      ...app('b', 'other', '2026-11-04T10:00:00Z'),
      memberUid: sessionUid,
    } as AiApp;
    expect(getLatestOwnAiApp([someoneElses], sessionUid)).toBeNull();
  });

  it('lets a malformed date sort last instead of winning', () => {
    expect(getLatestOwnAiApp([app('x', sessionUid, 'not a date'), ...apps], sessionUid)?.uid).toBe('c');
  });

  it('returns null with no apps or no member', () => {
    expect(getLatestOwnAiApp([], sessionUid)).toBeNull();
    expect(getLatestOwnAiApp(apps, undefined)).toBeNull();
    expect(getLatestOwnAiApp(apps, null)).toBeNull();
  });
});
