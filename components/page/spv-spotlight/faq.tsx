import React from 'react';
import type { FAQItem } from '@/app/constants/demoday';
import s from './SpvSpotlightView.module.scss';

// The SPV Spotlight's own questions, from the approved prototypes' copy.
// Placeholder wording until marketing / legal review it.

const WHAT_IS_SPOTLIGHT: FAQItem = {
  question: 'What is PL Spotlight?',
  answer:
    "PL Spotlight is how Protocol Labs brings a small set of PL Network teams to outside investors. Each Spotlight is one SPV (special purpose vehicle) led by Protocol Labs Capital into one team's round.",
};

const WHEN_CLOSED: FAQItem = {
  question: 'What happens when a Spotlight closes?',
  answer: 'The SPV stops taking commitments and its data room is no longer available on this page.',
};

/**
 * For the token-link model (the default): invited viewers only, since locked
 * pages show no FAQ. A function because one answer carries the backend's support
 * email, and its link is measured like the page's other mailto links.
 */
export const getSpvFaqItems = ({
  supportEmail,
  onSupportEmailClicked,
  emailOnDataRoomRequest = false,
}: {
  supportEmail: string;
  onSupportEmailClicked: () => void;
  emailOnDataRoomRequest?: boolean;
}): FAQItem[] => [
  WHAT_IS_SPOTLIGHT,
  {
    question: 'How do I see the materials?',
    answer: emailOnDataRoomRequest
      ? 'Request data room access opens the data room and sends an email connecting you to the SPV team. After that, Open data room opens the link.'
      : "Access data room opens the SPV's data room on DocSend.",
  },
  {
    question: 'What does the investor profile do?',
    answer:
      'It records your preferred check size, stage and sector, so the deals you see are filtered to match. You can change it any time from the avatar menu.',
  },
  {
    question: "Why can't I open this page?",
    answer: (
      <>
        Spotlights are shared by invitation, so a link opens only for the people it was sent to, signed in with the
        email it was sent to. If you think you should have access, email{' '}
        <a href={`mailto:${supportEmail}`} className={s.faqLink} onClick={onSupportEmailClicked}>
          {supportEmail}
        </a>{' '}
        and we will check the invitation list.
      </>
    ),
  },
  WHEN_CLOSED,
];

/** For the request flow (`REQUEST_FLOW_ENABLED`). */
export const SPV_REQUEST_FLOW_FAQ_ITEMS: FAQItem[] = [
  WHAT_IS_SPOTLIGHT,
  {
    question: 'Who can request access?',
    answer:
      'Accredited investors, and people investing on behalf of a VC fund or institution. A request takes your email, name, role and organization. If you are new, it also creates a free PL Network account.',
  },
  {
    question: 'What happens after I request access?',
    answer:
      "The PL team reviews every request. We email you when you are approved. After that, the Spotlight page shows Access data room, which opens the team's DocSend.",
  },
  {
    question: 'I was invited — do I still need to request access?',
    answer:
      'No. Sign in with the email your invitation was sent to and the data room opens on this page. If you were sent the public link, request access with your email — that creates your account.',
  },
  WHEN_CLOSED,
];
