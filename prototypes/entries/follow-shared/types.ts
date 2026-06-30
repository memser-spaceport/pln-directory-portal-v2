// Shared types for the follow-teams-and-people prototype.
// Kept dependency-free so both the profile and feed entries can import them.

export type FollowableKind = 'member' | 'team';

/** A thing you can follow — a person or a team. */
export interface Followable {
  id: string;
  kind: FollowableKind;
  name: string;
  /** Avatar (member) or logo (team). When absent we render an initials fallback. */
  image?: string | null;
  /** One-line context shown under the name (member role / team tagline). */
  subtitle?: string;
}

/** One notification preference inside the "what you hear about" set. */
export interface NotificationPref {
  key: string;
  label: string;
  helper: string;
}

/**
 * Granular preferences, tuned per kind. A single Follow opts you into all of
 * them; the toggles let people tune what they actually get notified about.
 */
export const MEMBER_PREFS: NotificationPref[] = [
  { key: 'forum', label: 'Forum posts & replies', helper: 'When they start or reply to a discussion' },
  { key: 'events', label: 'Event activity', helper: "When they're speaking at or attending an event" },
  { key: 'profile', label: 'Profile updates', helper: 'New role, team, or office-hours availability' },
];

export const TEAM_PREFS: NotificationPref[] = [
  { key: 'news', label: 'News & announcements', helper: 'Funding, launches, partnerships, milestones' },
  { key: 'forum', label: 'Forum activity', helper: 'When the team or its members post' },
  { key: 'events', label: 'Events', helper: 'When the team hosts or attends an event' },
  { key: 'hiring', label: 'New roles & hiring', helper: 'When the team opens positions' },
];

export function prefsFor(kind: FollowableKind): NotificationPref[] {
  return kind === 'team' ? TEAM_PREFS : MEMBER_PREFS;
}

/** Default state: following everything (all toggles on). */
export function defaultPrefValues(kind: FollowableKind): Record<string, boolean> {
  return Object.fromEntries(prefsFor(kind).map((p) => [p.key, true]));
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
}
