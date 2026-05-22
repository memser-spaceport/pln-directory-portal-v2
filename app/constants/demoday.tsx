import React, { ReactNode } from 'react';

import { LOGOS } from '@/components/common/LogosGrid/constants';
import { APPLY_FOR_NEXT_DEMO_DAY_URL, INVITE_FORM_URL } from '@/constants/demoDay';

import { FaqLink } from '@/components/page/demo-day/LandingBase/components/FaqLink';
import { FaqScrollLink } from '@/components/page/demo-day/LandingBase/components/FaqScrollLink';
import { FaqBulletList } from '@/components/page/demo-day/LandingBase/components/FaqBulletList';

export interface FAQItem {
  question: string;
  answer: ReactNode;
}

const PROTOCOL_LABS_LINK = 'https://protocol.ai/';
const X_LINK = 'https://x.com/protocollabs';
const LINKEDIN_LINK = 'https://www.linkedin.com/company/protocollabs/posts/?feedView=all';
const YOUTUBE_LINK = 'https://www.youtube.com/@ProtocolLabs';
const DIRECTORY_LINK =
  'https://www.protocol.ai/blog/transcription-pl-vision-driving-a-breakthroughs-in-computing-to-push-humanity-forward/';
const DESCRIPTION_LINK =
  'https://www.protocol.ai/blog/transcription-pl-vision-driving-a-breakthroughs-in-computing-to-push-humanity-forward/';

export const PRIVACY_POLICY_URL = 'https://drive.google.com/file/d/1RIAyMlyuLYnipa6W_YBzcJ6hDzfH7yW3/view';
export const TERMS_AND_CONDITIONS_URL = 'https://drive.google.com/file/d/1MjOF66asddB_hsg7Jc-7Oxk6L1EvYHxk/view';

export const NETWORK_PARTNER_DEMO_DAY_SLUGS = {
  crecimientoFoundersSchool1: 'partner26-1',
};

export const NETWORK_PARTNER_DEMO_DAY_FOOTER_DISCLAIMER =
  'All content is provided by the founders. Founder School & Crecimiento Demo Day organizers do not endorse or recommend any investment.';

/** Case-insensitive match for demo day `slugURL` / route segment. */
export function isNetworkPartnerDemoDaySlug(slug: string | null | undefined): boolean {
  return Object.values(NETWORK_PARTNER_DEMO_DAY_SLUGS).includes(slug?.toLowerCase() ?? '');
}

export const faqItems = [
  {
    question: 'What is Protocol Labs Demo Day?',
    answer: (
      <FaqBulletList
        items={[
          <span key={1}>
            PL Demo Day is a concentrated virtual event featuring the most promising teams from across the{' '}
            <FaqLink href={PROTOCOL_LABS_LINK}>Protocol Labs (PL)</FaqLink> network. A pre-selected batch of
            high-quality startups will deliver pitches, in a fully asynchronous environment.
          </span>,
          'Attendees will have access to single-slide company summaries and 3-min video pitches through our online platform.',
          "Attendees can directly connect with companies they're interested in by clicking buttons that will automatically send intro emails on their behalf. Alternatively, the founder's email address and Telegram handle will be available for direct outreach.",
        ]}
      />
    ),
  },
  {
    question: 'Who can attend?',
    answer: (
      <FaqBulletList
        items={[
          'PL Demo Day is an invite-only event for investors. Invitations are being sent to a vetted list of angel investors and VCs.',
        ]}
      />
    ),
  },
  {
    question: 'How can I learn more about projects in the Protocol Labs network?',
    answer: (
      <FaqBulletList
        items={[
          <span key={1}>
            Read about the vision, mission and focus areas of the Protocol Labs Network{' '}
            <FaqLink href={DESCRIPTION_LINK}>here</FaqLink>.
          </span>,
          <span key={2}>
            Explore <FaqLink href="/members">members</FaqLink> and <FaqLink href="/teams">teams</FaqLink> in LabOS.
          </span>,
          <span key={3}>
            Latest updates can be found on our social channels: <FaqLink href={X_LINK}>X</FaqLink>
            {', '}
            <FaqLink href={LINKEDIN_LINK}>LinkedIn</FaqLink> & <FaqLink href={YOUTUBE_LINK}>Youtube</FaqLink>.
          </span>,
        ]}
      />
    ),
  },
];

export const faqCompletedItems = [
  {
    question: 'What is Protocol Labs Demo Day?',
    answer: (
      <FaqBulletList
        items={[
          <span key={1}>
            PL Demo Day is a concentrated virtual event featuring the most promising teams from across the{' '}
            <FaqLink href={PROTOCOL_LABS_LINK}>Protocol Labs (PL)</FaqLink> network. A pre-selected batch of
            high-quality startups will deliver pitches, in a fully asynchronous environment.
          </span>,
          'Attendees will have access to single-slide company summaries and 3-min video pitches through our online platform.',
          "Attendees can directly connect with companies they're interested in by clicking buttons that will automatically send intro emails on their behalf. Alternatively, the founder's email address and Telegram handle will be available for direct outreach.",
        ]}
      />
    ),
  },
  {
    question: 'Who can attend?',
    answer: (
      <FaqBulletList
        items={[
          'PL Demo Day is an invite-only event for investors. Invitations are being sent to a vetted list of angel investors and VCs.',
        ]}
      />
    ),
  },
  {
    question: 'How can I learn more about projects in the Protocol Labs network?',
    answer: (
      <FaqBulletList
        items={[
          <span key={1}>
            Read about the vision, mission and focus areas of the Protocol Labs Network{' '}
            <FaqLink href={DESCRIPTION_LINK}>here</FaqLink>.
          </span>,
          <span key={2}>
            Explore <FaqLink href="/members">members</FaqLink> and <FaqLink href="/teams">teams</FaqLink> in LabOS.
          </span>,
          <span key={3}>
            Latest updates can be found on our social channels: <FaqLink href={X_LINK}>X</FaqLink>
            {', '}
            <FaqLink href={LINKEDIN_LINK}>LinkedIn</FaqLink> & <FaqLink href={YOUTUBE_LINK}>Youtube</FaqLink>.
          </span>,
        ]}
      />
    ),
  },
];

const crecimientoFoundersSchool1FaqItems: FAQItem[] = [
  {
    question: 'What is Founder School & Crecimiento Demo Day?',
    answer: (
      <FaqBulletList
        items={[
          <span key={1}>
            Founder School & Crecimiento Demo Day is a concentrated virtual event featuring teams from two of our
            network&apos;s founder programs, Crecimiento and Founders School. Early-stage startups will deliver pitches
            in a fully asynchronous environment. Attendees will have access to single-slide company summaries and
            3-minute video pitches through our online platform. Attendees can directly connect with companies
            they&apos;re interested in by clicking buttons that will automatically send intro emails on their behalf.
          </span>,
        ]}
      />
    ),
  },
  {
    question: 'Who can attend?',
    answer: (
      <FaqBulletList
        items={[
          'Founder School & Crecimiento Demo Day is an invite-only event for accredited investors. Invitations are being sent to a vetted list of angel investors and VCs.',
        ]}
      />
    ),
  },
  {
    question: 'What is Crecimiento?',
    answer: (
      <FaqBulletList
        items={[
          'Crecimiento is a builder community accelerating the next generation of Latin American crypto and AI founders. Its program supports early-stage teams shipping into global markets, with deep emphasis on technical craft, distribution, and capital readiness. You can learn more about Crecimiento and its founder cohorts through its public channels.',
        ]}
      />
    ),
  },
  {
    question: 'What is Founders School?',
    answer: (
      <FaqBulletList
        items={[
          'Founders School is an immersive program for early-stage founders building at the frontier of AI, blockchain, and DeFi. The curriculum combines hands-on technical mentorship with go-to-market, fundraising, and operator coaching, preparing each team to pitch live capital partners by program end.',
        ]}
      />
    ),
  },
  {
    question: 'How can I learn more about the founders and teams featured?',
    answer: (
      <FaqBulletList
        items={[
          "Once registered, you'll get access to the team roster on the Founder School & Crecimiento Demo Day platform, including company summaries, pitch videos, founder bios, and direct contact options. The latest program updates from Crecimiento and Founders School can be found on their respective social channels.",
        ]}
      />
    ),
  },
  {
    question: 'How can I learn more about projects in the Protocol Labs network?',
    answer: (
      <FaqBulletList
        items={[
          <span key={1}>
            Read about the vision, mission and focus areas of the Protocol Labs Network{' '}
            <FaqLink href={DESCRIPTION_LINK}>here</FaqLink>.
          </span>,
          <span key={2}>
            Explore <FaqLink href="/members">members</FaqLink> and <FaqLink href="/teams">teams</FaqLink> in LabOS.
          </span>,
          <span key={3}>
            Latest updates can be found on our social channels: <FaqLink href={X_LINK}>X</FaqLink>
            {', '}
            <FaqLink href={LINKEDIN_LINK}>LinkedIn</FaqLink> & <FaqLink href={YOUTUBE_LINK}>Youtube</FaqLink>.
          </span>,
        ]}
      />
    ),
  },
];

// Demo day specific FAQ items mapped by slug (use `slugURL` from demo day state)
export const demoDayFaqMap: Record<string, FAQItem[]> = {
  [NETWORK_PARTNER_DEMO_DAY_SLUGS.crecimientoFoundersSchool1]: crecimientoFoundersSchool1FaqItems,
};

const PARTNER_DEMO_DAY_LANDING_LOGOS = [
  '/icons/demoday/landing/partner-logos/crecisolnegro.png',
  '/icons/demoday/landing/partner-logos/founder_school.jpg',
] as const;

export const DEFAULT_LANDING_LOGOS_TITLE = 'Teams featured in past demo days raised from top VCs and Angel Investors';

// Demo day specific landing logos mapped by slug (use `slugURL` from demo day state)
export const demoDayLandingLogosMap: Record<string, readonly string[]> = {
  [NETWORK_PARTNER_DEMO_DAY_SLUGS.crecimientoFoundersSchool1]: PARTNER_DEMO_DAY_LANDING_LOGOS,
};

export const demoDayLandingLogosTitleMap: Record<string, string> = {
  [NETWORK_PARTNER_DEMO_DAY_SLUGS.crecimientoFoundersSchool1]: '',
};

export interface DemoDayCalendarLinks {
  googleCalendarUrl: string;
  icsFileUrl: string;
}

const DEFAULT_GOOGLE_CALENDAR_URL =
  'https://calendar.google.com/calendar/event?action=TEMPLATE&tmeid=NThocXJ2bDIwc2FxM2hlNTJzaGtoODRjOWMgY181MzAyZDMzYTg4ODA5MTA5M2Y1YzAyMzY2ZGM1ZWZjYWZlM2RkNTc2MDgxZjE2MWMxNzljZmFiYWNjZjFmOThlQGc&tmsrc=c_5302d33a888091093f5c02366dc5efcafe3dd576081f161c179cfabaccf1f98e%40group.calendar.google.com';

const DEFAULT_ICS_FILE_URL =
  'https://pl-directory-uploads-prod.s3.us-west-1.amazonaws.com/pl_w26_demo_day_investor_event.ics';

export const defaultCalendarLinks: DemoDayCalendarLinks = {
  googleCalendarUrl: DEFAULT_GOOGLE_CALENDAR_URL,
  icsFileUrl: DEFAULT_ICS_FILE_URL,
};

// Demo day specific calendar links mapped by slug (use `slugURL` from demo day state)
// Falls back to default links if no specific config is found
export const demoDayCalendarLinksMap: Record<string, DemoDayCalendarLinks> = {
  [NETWORK_PARTNER_DEMO_DAY_SLUGS.crecimientoFoundersSchool1]: {
    googleCalendarUrl:
      'https://calendar.google.com/calendar/event?action=TEMPLATE&tmeid=NjViajcxaWRiZWVxY2Z1ZHZkN2RvZmNjNm8gY181MzAyZDMzYTg4ODA5MTA5M2Y1YzAyMzY2ZGM1ZWZjYWZlM2RkNTc2MDgxZjE2MWMxNzljZmFiYWNjZjFmOThlQGc&tmsrc=c_5302d33a888091093f5c02366dc5efcafe3dd576081f161c179cfabaccf1f98e%40group.calendar.google.com',
    icsFileUrl:
      'https://pl-directory-uploads-prod.s3.us-west-1.amazonaws.com/pl_partner26-1_demo_day_investor_event.ics',
  },
};

/**
 * Get calendar links for a demo day by slug.
 * Returns default links if no specific config is found.
 */
export function getCalendarLinksByDemoDaySlug(slug: string | null | undefined): DemoDayCalendarLinks {
  if (!slug) return defaultCalendarLinks;

  const exact = demoDayCalendarLinksMap[slug];
  if (exact) return exact;

  const matchKey = Object.keys(demoDayCalendarLinksMap).find((k) => k.toLowerCase() === slug.toLowerCase());
  if (matchKey) return demoDayCalendarLinksMap[matchKey];

  return defaultCalendarLinks;
}

/**
 * Get landing page investor logos for a demo day by slug.
 * Returns the default PL logo grid if no specific config is found.
 */
export function getLandingLogosByDemoDaySlug(slug: string | null | undefined): readonly string[] {
  if (!slug) return LOGOS;

  const exact = demoDayLandingLogosMap[slug];
  if (exact) return exact;

  const matchKey = Object.keys(demoDayLandingLogosMap).find((k) => k.toLowerCase() === slug.toLowerCase());
  if (matchKey) return demoDayLandingLogosMap[matchKey];

  return LOGOS;
}

export function getLandingLogosTitleByDemoDaySlug(slug: string | null | undefined): string {
  if (!slug) return DEFAULT_LANDING_LOGOS_TITLE;

  const exact = demoDayLandingLogosTitleMap[slug];
  if (exact) return exact;

  const matchKey = Object.keys(demoDayLandingLogosTitleMap).find((k) => k.toLowerCase() === slug.toLowerCase());
  if (matchKey) return demoDayLandingLogosTitleMap[matchKey];

  return DEFAULT_LANDING_LOGOS_TITLE;
}
