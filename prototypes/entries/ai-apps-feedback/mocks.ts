// Mock data for the AI Apps feedback prototype. No API calls.
// Reuses the app list + iframe previews from the sibling `ai-apps` entry so the
// two prototypes never drift, then layers mocked feedback + a current-user role
// on top.
import type { AiApp } from '@/services/ai-apps/ai-apps.service';

export { mockAiApps, mockAppPreviews, mockPageCopy } from '../ai-apps/mocks';

export type DemoRole = 'member' | 'author' | 'admin';

// The signed-in person for the demo. As `author` they own app-1 (Warm Intro
// Matcher); as `admin` they can see feedback across every app.
export const currentUser = {
  uid: 'm-1',
  name: 'Polina Bublii',
};

export interface FeedbackEntry {
  id: string;
  appUid: string;
  appName: string;
  authorUid: string;
  authorName: string;
  text: string;
  createdAt: string; // ISO
}

// Seeded feedback across the three mock apps, from a mix of network members.
export const mockFeedback: FeedbackEntry[] = [
  {
    id: 'fb-1',
    appUid: 'app-1',
    appName: 'Warm Intro Matcher',
    authorUid: 'm-9',
    authorName: 'Roneil Rumburg',
    text: 'Really useful for finding the shortest path to an investor. The draft intro copy is a bit generic though — would love if it pulled in why the two people should talk.',
    createdAt: '2026-07-04T09:12:00.000Z',
  },
  {
    id: 'fb-2',
    appUid: 'app-1',
    appName: 'Warm Intro Matcher',
    authorUid: 'm-4',
    authorName: 'Juan Benet',
    text: 'Match score is great signal. One ask: let me exclude connectors I have already asked recently so I do not over-tap the same people.',
    createdAt: '2026-07-02T16:40:00.000Z',
  },
  {
    id: 'fb-3',
    appUid: 'app-1',
    appName: 'Warm Intro Matcher',
    authorUid: 'm-7',
    authorName: 'Evan Miyazono',
    text: 'Found a path I did not know existed. Would pay for this.',
    createdAt: '2026-06-28T11:05:00.000Z',
  },
  {
    id: 'fb-4',
    appUid: 'app-2',
    appName: 'Founder Digest',
    authorUid: 'm-5',
    authorName: 'Molly Mackinlay',
    text: 'The weekly ranking is on point, but I only care about two focus areas — a filter to scope the digest would make it a daily-open for me.',
    createdAt: '2026-07-05T08:20:00.000Z',
  },
  {
    id: 'fb-5',
    appUid: 'app-2',
    appName: 'Founder Digest',
    authorUid: 'm-8',
    authorName: 'Dietrich Ayala',
    text: 'Flagged founders section surfaced two I had missed. Small thing: the email version breaks on mobile.',
    createdAt: '2026-07-01T13:55:00.000Z',
  },
  {
    id: 'fb-6',
    appUid: 'app-3',
    appName: 'Event Scout',
    authorUid: 'm-6',
    authorName: 'Andrew Hill',
    text: 'The "who is already going" list is the killer feature. Please add a way to export attendees to a calendar invite.',
    createdAt: '2026-07-03T18:30:00.000Z',
  },
];
