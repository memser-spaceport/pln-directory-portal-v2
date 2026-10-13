import type { FAQItem } from '@/app/constants/demoday';

// The SPV Spotlight's own questions, from the approved prototype's copy.
// Placeholder wording until marketing / legal review it.
export const SPV_FAQ_ITEMS: FAQItem[] = [
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
