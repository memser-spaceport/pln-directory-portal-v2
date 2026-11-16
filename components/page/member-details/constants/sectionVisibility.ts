import type { SectionVisibility } from '@/components/common/profile/SectionVisibility/types/sectionVisibility';

export const MEMBER_SECTION_VISIBILITY = {
  profile: {
    level: 'public',
    label: 'Public',
    description:
      'Anyone can see your photo, name, teams, role, skills and bio, including logged-out visitors. Your location is shown to logged-in members only.',
  },
  investorProfile: {
    level: 'shared',
    label: 'Shared on intro',
    description: 'Hidden on your profile from other members. Founders see it when you are introduced to them.',
  },
  cv: {
    level: 'shared',
    label: 'Shared when you apply',
    description: 'Hidden on your profile from other members. Leads of the teams you apply to can see it.',
  },
} satisfies Record<string, SectionVisibility>;
