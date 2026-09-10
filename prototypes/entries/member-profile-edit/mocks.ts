// Mocked data for the member-profile-edit prototype. No services, no network.
//
// The record is `member-profile`'s Maya Okonkwo, re-shaped into the flat editable
// record the job board's profile step already uses (`ExperienceEntry` with
// 'YYYY-MM' dates, skills as strings), so the forms here write the same shape the
// other two editing surfaces write. Reading the same mock rather than copying it
// keeps this page and the read-only profile prototype one person.

import type { ExperienceEntry } from '../job-board/viewerState';
import { MOCK_AVATAR, MOCK_EXPERIENCE, MOCK_MEMBER } from '../member-profile/mocks';

export interface ContactHandles {
  email: string;
  linkedin: string;
  telegram: string;
  github: string;
  discord: string;
  twitter: string;
  bluesky: string;
}

export interface ProfileRecord {
  name: string;
  avatar: string;
  role: string;
  /** Production's primary team is a select over the teams API; here it is the team's name. */
  team: string;
  location: string;
  skills: string[];
  /** Rich text, as production stores it (Quill HTML). */
  bio: string;
  openToWork: boolean;
  officeHours: string;
  ohInterest: string[];
  ohHelpWith: string[];
  contacts: ContactHandles;
  shareContacts: boolean;
  experiences: ExperienceEntry[];
}

/** ISO → 'YYYY-MM', the form record's date grain. */
const ym = (iso: string | null | undefined): string | null => (iso ? iso.slice(0, 7) : null);

export const SEED_PROFILE: ProfileRecord = {
  name: MOCK_MEMBER.name,
  avatar: MOCK_AVATAR,
  role: MOCK_MEMBER.role,
  team: MOCK_MEMBER.teams[0].name,
  location: MOCK_MEMBER.locationLabel,
  skills: MOCK_MEMBER.skills.map((skill) => skill.title),
  // `member-profile` keeps the bio as plain text; production's field is a rich
  // editor, so it is wrapped as the one paragraph Quill would have saved.
  bio: `<p>${MOCK_MEMBER.bio}</p>`,
  openToWork: MOCK_MEMBER.openToWork,
  officeHours: MOCK_MEMBER.officeHours,
  ohInterest: [...MOCK_MEMBER.ohInterest],
  ohHelpWith: [...MOCK_MEMBER.ohHelpWith],
  contacts: {
    email: MOCK_MEMBER.email,
    linkedin: MOCK_MEMBER.linkedinHandle,
    telegram: MOCK_MEMBER.telegramHandle,
    github: MOCK_MEMBER.githubHandle,
    discord: MOCK_MEMBER.discordHandle,
    twitter: MOCK_MEMBER.twitter,
    bluesky: MOCK_MEMBER.blueskyHandle,
  },
  shareContacts: true,
  experiences: MOCK_EXPERIENCE.map((entry) => ({
    uid: entry.uid,
    title: entry.title,
    company: entry.company,
    description: entry.description ?? '',
    startDate: ym(entry.startDate) ?? '',
    endDate: entry.isCurrent ? null : ym(entry.endDate),
    isCurrent: entry.isCurrent,
    location: entry.location ?? '',
  })),
};
