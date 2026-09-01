// Default values + options for the mocked Profile settings form.

export const DEFAULT_VALUES = {
  name: 'Maya Okonkwo',
  email: 'maya@latticecompute.xyz',
  bio: 'Building verifiable compute markets for AI training. Previously ran the GPU scheduling team at a top-5 cloud. Currently raising a seed extension.',
  team: 'Lattice Compute',
  role: 'Co-founder & CEO',
  skills: ['Distributed Systems', 'Machine Learning Infra', 'Fundraising'],
  linkedin: 'maya-okonkwo',
  github: 'mayaokonkwo',
  twitter: 'mayaokonkwo',
  telegram: 'mayaok',
  discord: 'maya#4417',
  /* Experience used to be seven flattened fields here — one entry, on the
     reasoning that "an add/remove list editor is a bigger surface than this
     prototype is asking a question about". That was written when the job board
     wrote this record through a two-step modal that only ever captured a current
     role. That modal is gone, production's Experience is a list, and the CV
     importer returns several positions at once — so a single flat entry stopped
     being a simplification and became a different feature. The list now lives in
     component state (`SEED_EXPERIENCES` below) rather than in the form, because
     RHF is carrying scalar fields here and a list needs add / edit / delete
     rather than `register`. */
  openToCollaborate: true,
  officeHours: true,
};

export const TEAM_OPTIONS = [
  { value: 'lattice', label: 'Lattice Compute' },
  { value: 'protocol-labs', label: 'Protocol Labs' },
  { value: 'filecoin', label: 'Filecoin Foundation' },
];

export const SKILL_OPTIONS = [
  { value: 'Distributed Systems', label: 'Distributed Systems' },
  { value: 'Machine Learning Infra', label: 'Machine Learning Infra' },
  { value: 'Go-to-Market', label: 'Go-to-Market' },
  { value: 'Fundraising', label: 'Fundraising' },
  { value: 'Cryptography', label: 'Cryptography' },
  { value: 'Product', label: 'Product' },
];

export interface SettingsNavItem {
  name: string;
  icon: string;
  activeIcon: string;
}

export const PREFERENCES: SettingsNavItem[] = [
  { name: 'profile', icon: '/icons/profile.svg', activeIcon: '/icons/profile-blue.svg' },
  { name: 'connected accounts', icon: '/icons/profile.svg', activeIcon: '/icons/profile-blue.svg' },
  { name: 'email preferences', icon: '/icons/email.svg', activeIcon: '/icons/email-blue.svg' },
  { name: 'privacy', icon: '/icons/profile.svg', activeIcon: '/icons/profile-blue.svg' },
  { name: 'job alert', icon: '/icons/briefcase.svg', activeIcon: '/icons/briefcase-blue.svg' },
];

export const MOCK_AVATAR = 'https://i.pravatar.cc/160?img=47';

/**
 * The work history the settings page opens with.
 *
 * Shaped as the job board's `ExperienceEntry` because it *is* that record —
 * production keeps one Experience list per member and this page and the apply
 * drawer are two windows onto it. One entry, so the page opens showing the list
 * doing something; the empty state is reachable by deleting it.
 */
export const SEED_EXPERIENCES = [
  {
    uid: 'settings-exp-1',
    title: 'Co-founder & CEO',
    company: 'Lattice Compute',
    description: '<p>Building verifiable compute markets for AI training.</p>',
    startDate: '2022-03',
    endDate: null as string | null,
    isCurrent: true,
    location: 'Berlin, Germany',
  },
];
