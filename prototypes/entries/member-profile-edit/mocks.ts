// Mocked data for the member-profile-edit prototype. No services, no network.
//
// The record is `member-profile`'s Maya Okonkwo, re-shaped into the flat editable
// record the job board's profile step already uses (`ExperienceEntry` with
// 'YYYY-MM' dates, skills as strings), so the forms here write the same shape the
// other two editing surfaces write. Reading the same mock rather than copying it
// keeps this page and the read-only profile prototype one person.

import { MOCK_AVATAR, MOCK_EXPERIENCE, MOCK_MEMBER } from '../member-profile/mocks';
// The record's shape lives with the editors that write it, since the
// new-member page writes the same one.
import type { ProfileRecord } from '../profile-shared/SectionEditor/types';

export type { ContactHandles, ProfileRecord } from '../profile-shared/SectionEditor/types';

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
