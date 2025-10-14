import React from 'react';

import { INVITE_FORM_URL } from '@/constants/demoDay';

import { FaqLink } from '@/components/page/demo-day/LandingBase/components/FaqLink';
import { FaqBulletList } from '@/components/page/demo-day/LandingBase/components/FaqBulletList';

const PROTOCOL_LABS_LINK = 'https://protocol.ai/';
const X_LINK = 'https://x.com/protocollabs';
const LINKEDIN_LINK = 'https://www.linkedin.com/company/protocollabs/posts/?feedView=all';
const YOUTUBE_LINK = 'https://www.youtube.com/@ProtocolLabs';
const DIRECTORY_LINK =
  'https://www.protocol.ai/blog/transcription-pl-vision-driving-a-breakthroughs-in-computing-to-push-humanity-forward/';
const DESCRIPTION_LINK =
  'https://www.protocol.ai/blog/transcription-pl-vision-driving-a-breakthroughs-in-computing-to-push-humanity-forward/';

export const faqItems = [
  {
    question: 'What is Protocol Labs F25 Demo Day?',
    answer: (
      <FaqBulletList
        items={[
          <span key={1}>
            PL F25 Demo Day is a concentrated virtual event featuring the most promising teams from across the{' '}
            <FaqLink href={PROTOCOL_LABS_LINK}>Protocol Labs (PL)</FaqLink> network. A pre-selected batch of
            high-quality startups will deliver pitches, in a fully asynchronous environment.
          </span>,
          'Attendees will have access to single-slide company summaries and 3-min video pitches through our online platform which will go live on Oct 23, 11:00 UTC, and will be available until Nov 6, 11:00 UTC.',
          "Attendees can directly connect with companies they're interested in by clicking buttons that will automatically send emails on their behalf. Alternatively, the founder's email address and Telegram handle will be available for direct outreach.",
        ]}
      />
    ),
  },
  {
    question: 'Who can attend?',
    answer: (
      <FaqBulletList
        items={[
          'PL F25 Demo Day is an invite-only event for investors. Invitations are being sent to a vetted list of angel investors and VCs.',
          <span key={1}>
            If you think you should attend, <FaqLink href={INVITE_FORM_URL}>Request to Join</FaqLink>.
          </span>,
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
            Read about the vision, mission and focus areas of Protocol Labs{' '}
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
