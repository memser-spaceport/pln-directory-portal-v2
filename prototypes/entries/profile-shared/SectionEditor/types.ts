// The flat, editable profile record the section editors read and write.
//
// It first lived in `member-profile-edit/mocks.ts` next to the seed that fills
// it. It is here because two hosts now open the same editors — the filled
// profile (`member-profile-edit`) and the brand-new one (`onboarding`) — and a
// shape both write has to be owned by neither. The seeds stay with their pages.

import type { ExperienceEntry } from '../../job-board/viewerState';

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

/** Every handle blank — what a profile holds before anyone has typed one. */
export const EMPTY_CONTACTS: ContactHandles = {
  email: '',
  linkedin: '',
  telegram: '',
  github: '',
  discord: '',
  twitter: '',
  bluesky: '',
};
