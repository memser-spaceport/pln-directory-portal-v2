import type { FAQItem } from '@/app/constants/demoday';

// The SPV Spotlight's own questions, from the approved prototypes' copy.
// Placeholder wording until marketing / legal review it.

/**
 * For the token-link model (the default): invited viewers only, since locked
 * pages show no FAQ.
 */
export const SPV_FAQ_ITEMS: FAQItem[] = [
  {
    question: 'What is PL Spotlight?',
    answer:
      "PL Spotlight is how Protocol Labs brings a small set of PL Network teams to outside investors. Each Spotlight is one SPV (special purpose vehicle) led by Protocol Labs into one team's round.",
  },
  {
    question: 'How do I see the materials?',
    answer:
      "Request data room access takes you to the team's DocSend, where you ask for access and then read the pitch and the SPV terms. Nothing is uploaded to this page.",
  },
  {
    question: 'What does the investor profile do?',
    answer:
      'It tells us your check size, stages and focus, so we only send you deals that fit. You can change it any time from the avatar menu.',
  },
  {
    question: 'The page says I do not have access.',
    answer:
      'Spotlights are shared by invitation, so a forwarded link opens only for the people it was sent to. Use Contact us on that page and we will check the invitation list.',
  },
  {
    question: 'What happens when a Spotlight closes?',
    answer: 'The SPV stops taking commitments and its data room is no longer available on this page.',
  },
];

/** For the request flow (`REQUEST_FLOW_ENABLED`). */
export const SPV_REQUEST_FLOW_FAQ_ITEMS: FAQItem[] = [
  {
    question: 'What is PL Spotlight?',
    answer:
      "PL Spotlight is how Protocol Labs brings a small set of PL Network teams to outside investors. Each Spotlight is one SPV (special purpose vehicle) led by Protocol Labs into one team's round.",
  },
  {
    question: 'Who can request access?',
    answer:
      'Accredited investors, and people investing on behalf of a VC fund or institution. A request takes your email, name, role and organization. If you are new, it also creates a free PL Network account.',
  },
  {
    question: 'What happens after I request access?',
    answer:
      "The PL team reviews every request. We email you when you are approved. After that, the Spotlight page shows Open data room, which opens the team's DocSend.",
  },
  {
    question: 'I was invited — do I still need to request access?',
    answer:
      'No. Sign in with the email your invitation was sent to and the data room opens on this page. If you were sent the public link, request access with your email — that creates your account.',
  },
  {
    question: 'What happens when a Spotlight closes?',
    answer: 'The SPV stops taking commitments and its data room is no longer available on this page.',
  },
];
