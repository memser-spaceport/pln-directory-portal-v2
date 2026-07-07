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
