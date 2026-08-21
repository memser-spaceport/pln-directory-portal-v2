// PL Spotlight back-office participants table.
//
// Every row below is transcribed verbatim from the Figma frame
// "Container (Welcome to back-office!)" — node 750:690 in
// Back Office | Protocol Labs (file r1B2INuN2xKR31z9oDQWWt).
// Names, emails, teams, badges, follow-up counts, dates, template vars and the
// Send-vs-Resend state of each action button are exactly what the frame renders.

import { AVATAR_ANUJ_PANDEY } from './avatar';

/** The frame's "today" — both Aug 10, 2026 rows are same-day sends. */
export const SPOTLIGHT_TODAY = 'Aug 10, 2026';

export type InvestorType = 'Angel' | 'Fund' | 'not provided';

/**
 * Type / Access option sets.
 *
 * The Figma frame renders both cells as native <select> controls, so the canvas
 * shows the pill and the chevron but no selected label. The option sets below
 * come from production's own enums rather than being invented here:
 *   participantType — services/team-pitch/hooks/useGetTeamPitchAccess.ts
 *   accessLevel     — types/members.types.ts / types/shared.types.ts
 */
export const PARTICIPANT_TYPES = ['INVESTOR', 'FOUNDER', 'SUPPORT'] as const;
export type ParticipantType = (typeof PARTICIPANT_TYPES)[number];

export const ACCESS_LEVELS = ['L0', 'L1', 'L2', 'L3', 'L4', 'L5', 'L6', 'Rejected'] as const;
export type AccessLevel = (typeof ACCESS_LEVELS)[number];

/** Labels for the wide (220px) Access column — the level plus what it grants. */
export const ACCESS_LEVEL_LABELS: Record<AccessLevel, string> = {
  L0: 'L0 — Not verified',
  L1: 'L1 — Verified',
  L2: 'L2 — Directory',
  L3: 'L3 — Directory + forum',
  L4: 'L4 — Full member',
  L5: 'L5 — Investor (Spotlight)',
  L6: 'L6 — Investor (full)',
  Rejected: 'Rejected',
};

/** Title-case labels for the narrow (150px) Type column; values stay the enum. */
export const PARTICIPANT_TYPE_LABELS: Record<ParticipantType, string> = {
  INVESTOR: 'Investor',
  FOUNDER: 'Founder',
  SUPPORT: 'Support',
};

/**
 * The spotlight the whole table belongs to.
 *
 * The Figma frame never names it — the back-office screenshot shows the seed
 * values ("Test title", "My Test Team 1", pitch-support@mailinator.com). Those
 * are test fixtures, not copy, so a plausible spotlight stands in here. Nothing
 * in the table varies by it: every row's invite is for the same event, which is
 * why it is one constant rather than a per-row field.
 *
 * Note the two different "teams" in play: this is the team *presenting*, while
 * `SpotlightParticipant.team` is the investor's own fund.
 */
export const SPOTLIGHT_CONTEXT = {
  companyName: 'Devonian Systems',
  /**
   * The verb phrase that completes "<Company> …". Held as a fragment rather than
   * a whole sentence so `companyName` stays the single source of the name —
   * rename the company and the sentence follows.
   */
  companyBlurb:
    'builds mobile, AI-controlled reactors that convert biomass into electricity and registry-grade biochar',
  supportEmail: 'spotlight-support@protocol.ai',
};

/**
 * What the invite template can interpolate from the record.
 *
 * Rebuilt against the email PL actually sends. Two of these are editable in the
 * Overview card (`closeDate`, `senderName`), so the draft reads live state
 * rather than a module constant; the other two are properties of the company the
 * spotlight is for.
 *
 * `senderName` is nullable because the Overview's Sender Name is — and the real
 * email signs off with a person, so an unset one is visible in the preview
 * rather than silently papered over.
 */
export type InviteContext = {
  companyName: string;
  companyBlurb: string;
  closeDate: string;
  senderName: string | null;
};

// ── Overview ──────────────────────────────────────────────────────────────────
// The record the table belongs to, as the back-office app already renders it:
// Title / URL Slug / Status / Support Email / Sender Email / Sender Name /
// Reply-To Email / Analytics Report URL / Spotlight Statement, in that order,
// behind one "Edit" button. Transcribed from the app screenshot, not invented.
//
// `null` is the empty state and is displayed, not hidden — the screenshot shows
// five em dashes, so an admin reads this card to find out what is *not* set.
// Sender Email is the one field whose empty state has a name of its own
// ("System default"), because leaving it blank is a real configuration.

export const SPOTLIGHT_STATUSES = ['DRAFT', 'OPEN', 'CLOSED'] as const;
export type SpotlightStatus = (typeof SPOTLIGHT_STATUSES)[number];

export type SpotlightOverview = {
  title: string;
  slug: string;
  status: SpotlightStatus;
  /**
   * NOT in the back-office screenshot — added because the real invite names a
   * deadline ("the Spotlight page closes this coming Monday, July 27th"), so
   * the record has to hold one. A display string, not a Date: a prototype has
   * no formatter and the email prints it verbatim.
   */
  closesOn: string;
  supportEmail: string;
  /** null → "System default": the platform's own address sends the mail. */
  senderEmail: string | null;
  senderName: string | null;
  replyToEmail: string | null;
  analyticsReportUrl: string | null;
  statement: string | null;
};

/**
 * Seeded from the same fictional spotlight the table's invites are for, rather
 * than from the screenshot's test fixtures ("Test title", "my-test-team-1").
 * Two fields are deliberately left empty so the card's em-dash state is on
 * screen without having to clear anything.
 */
export const mockSpotlightOverview: SpotlightOverview = {
  title: `${SPOTLIGHT_CONTEXT.companyName} Spotlight`,
  slug: 'devonian-systems',
  status: 'OPEN',
  // Two weeks out from SPOTLIGHT_TODAY, and a Monday — the real email's deadline
  // is a Monday too, which is presumably not an accident.
  closesOn: 'Monday, August 24th',
  supportEmail: SPOTLIGHT_CONTEXT.supportEmail,
  senderEmail: null,
  // A person, not a brand: the real email signs off "Remi Antczak / Protocol
  // Labs", so Sender Name is what `{{sender_name}}` resolves to and "Protocol
  // Labs" is the fixed line under it.
  senderName: 'Remi Antczak',
  replyToEmail: 'remi@protocol.ai',
  analyticsReportUrl: null,
  statement: null,
};

export type SpotlightParticipant = {
  id: string;
  name: string;
  email: string;
  /** Data-URI avatar, or null when the frame renders name + email with no image. */
  avatarUrl: string | null;
  /** Renders the dark initial disc the frame shows as "Placeholder for Text". */
  avatarPlaceholder?: boolean;
  /** Team name + external link, or null for the frame's muted "-". */
  team: string | null;
  investorType: InvestorType;
  inviteAccepted: boolean;
  /** 0 renders the frame's em dash and flips the button to "Send Follow-up". */
  followUpsSent: number;
  followUpDate: string | null;
  /** Raw JSON string, or null for the frame's muted "no data". */
  templateVars: string | null;
  /** false → "Send Invite", true → "Resend Invite" (per the frame's layer names). */
  inviteSent: boolean;
  participantType: ParticipantType;
  accessLevel: AccessLevel;
};

/**
 * The stand-in the template editor's preview resolves against.
 *
 * NOT a row from the table. The preview used to borrow the first participant,
 * which put a real person's name on a specimen email and invited two wrong
 * readings: that the wording had something to do with her, and — since she is
 * also whoever is signed in — that the editor was showing the admin their own
 * mail. A template is written for nobody in particular, so it previews against
 * nobody in particular.
 *
 * It carries a `sector_hook`, because the preview can only show one branch and
 * the fuller email is the more useful one to land on; the notes under the preview
 * name which branch ran either way. Everything else is the shape
 * `buildInviteDraft` needs and nothing more — this row is never rendered in a
 * table, so its avatar, team and access fields are only here to satisfy the type.
 */
export const PREVIEW_RECIPIENT: SpotlightParticipant = {
  id: 'preview-recipient',
  name: 'John Doe',
  email: 'john.doe@example.com',
  avatarUrl: null,
  team: null,
  investorType: 'not provided',
  inviteAccepted: false,
  followUpsSent: 0,
  followUpDate: null,
  templateVars: '{"sector_hook":"climate and energy"}',
  inviteSent: false,
  participantType: 'INVESTOR',
  accessLevel: 'L5',
};

export const mockSpotlightParticipants: SpotlightParticipant[] = [
  {
    id: 'polina-bublii',
    name: 'Polina Bublii',
    email: 'polina@magicpowered.io',
    avatarUrl: null,
    team: null,
    investorType: 'Angel',
    inviteAccepted: true,
    followUpsSent: 2,
    followUpDate: 'Aug 10, 2026',
    templateVars: '{"sector_hook":"physical AI, climate and energy"}',
    inviteSent: true,
    participantType: 'SUPPORT',
    accessLevel: 'L6',
  },
  {
    id: 'oleh-kalenyk',
    name: 'Oleh Kalenyk',
    email: 'okalenyk@gmail.com',
    avatarUrl: null,
    team: 'Polaris Labs',
    investorType: 'not provided',
    inviteAccepted: true,
    followUpsSent: 0,
    followUpDate: null,
    templateVars: null,
    inviteSent: false,
    participantType: 'SUPPORT',
    accessLevel: 'L4',
  },
  {
    id: 'anuj-pandey',
    name: 'Anuj Pandey',
    email: 'anpan0x7@proton.me',
    avatarUrl: AVATAR_ANUJ_PANDEY,
    team: 'Polaris Labs',
    investorType: 'Angel',
    inviteAccepted: true,
    followUpsSent: 2,
    followUpDate: 'Jul 21, 2026',
    templateVars: null,
    inviteSent: false,
    participantType: 'INVESTOR',
    accessLevel: 'L5',
  },
  {
    id: 'bjorn-bauermeister',
    name: 'Björn Bauermeister',
    email: 'bjoern@siventures.de',
    avatarUrl: null,
    team: 'SI Ventures',
    investorType: 'Fund',
    inviteAccepted: false,
    followUpsSent: 2,
    followUpDate: 'Jul 24, 2026',
    templateVars: null,
    inviteSent: false,
    participantType: 'INVESTOR',
    accessLevel: 'L5',
  },
  {
    id: 'mathias-brink-lorenz',
    name: 'Mathias Brink Lorenz',
    email: 'mbl@delphinus.vc',
    avatarUrl: null,
    team: 'Delphinus',
    investorType: 'Fund',
    inviteAccepted: true,
    followUpsSent: 2,
    followUpDate: 'Jul 24, 2026',
    templateVars: '{"sector_hook":"energy"}',
    inviteSent: false,
    participantType: 'INVESTOR',
    accessLevel: 'L5',
  },
  {
    id: 'bryan-ciambella',
    name: 'Bryan Ciambella',
    email: 'bryan.ciambella@peakstate.vc',
    avatarUrl: null,
    team: 'PROOF (proof.vc)',
    investorType: 'Fund',
    inviteAccepted: false,
    followUpsSent: 2,
    followUpDate: 'Jul 24, 2026',
    templateVars: null,
    inviteSent: false,
    participantType: 'INVESTOR',
    accessLevel: 'L5',
  },
  {
    id: 'jari-tuovinen',
    name: 'Jari Tuovinen',
    email: 'jari@nft.vc',
    avatarUrl: null,
    team: 'Nordic Foodtech VC',
    investorType: 'Fund',
    inviteAccepted: false,
    followUpsSent: 2,
    followUpDate: 'Jul 24, 2026',
    templateVars: '{"sector_hook":"climate and agtech"}',
    inviteSent: false,
    participantType: 'INVESTOR',
    accessLevel: 'L5',
  },
  {
    id: 'tom-x-lee',
    name: 'Tom X Lee',
    email: 'tom@galileo.io',
    avatarUrl: null,
    team: 'Galileo Ventures',
    investorType: 'Fund',
    inviteAccepted: false,
    followUpsSent: 2,
    followUpDate: 'Jul 24, 2026',
    // The frame clips this string mid-word ("…deep tech and hardwar"); completed here.
    templateVars: '{"sector_hook":"physical AI, deep tech and hardware"}',
    inviteSent: false,
    participantType: 'INVESTOR',
    accessLevel: 'L5',
  },
  {
    id: 'romain-sautrau',
    name: 'Romain Sautrau',
    email: 'romain.sautrau@insead.edu',
    avatarUrl: null,
    team: 'SuperNova Invest',
    investorType: 'Fund',
    inviteAccepted: true,
    followUpsSent: 2,
    followUpDate: 'Jul 24, 2026',
    templateVars: '{"sector_hook":"physical AI, climate and energy"}',
    inviteSent: false,
    participantType: 'INVESTOR',
    accessLevel: 'L5',
  },
  {
    id: 'tony-arnerich',
    name: 'Tony Arnerich',
    email: 'tony@aum13f.com',
    avatarUrl: null,
    team: '3x5 Partners',
    investorType: 'Fund',
    inviteAccepted: false,
    followUpsSent: 2,
    followUpDate: 'Jul 24, 2026',
    templateVars: '{"sector_hook":"climate"}',
    inviteSent: false,
    participantType: 'INVESTOR',
    accessLevel: 'L5',
  },
  {
    id: 'lawrence-jacobs',
    name: 'Lawrence Jacobs',
    email: 'ljacobs@innovacap.com',
    avatarUrl: null,
    team: 'Innova Capital Partners (New York)',
    investorType: 'Fund',
    inviteAccepted: true,
    followUpsSent: 2,
    followUpDate: 'Jul 24, 2026',
    templateVars: '{"sector_hook":"energy"}',
    inviteSent: false,
    participantType: 'INVESTOR',
    accessLevel: 'L5',
  },
  {
    id: 'eden-dhaliwal',
    name: 'Eden Dhaliwal',
    email: 'eden@outlierventures.io',
    avatarUrl: null,
    team: 'Outlier Ventures (fmr)',
    investorType: 'Fund',
    inviteAccepted: false,
    followUpsSent: 2,
    followUpDate: 'Jul 24, 2026',
    templateVars: null,
    inviteSent: false,
    participantType: 'INVESTOR',
    accessLevel: 'L5',
  },
  {
    id: 'marc',
    name: 'Marc',
    email: 'm@c12.space',
    avatarUrl: null,
    team: null,
    investorType: 'not provided',
    inviteAccepted: true,
    followUpsSent: 2,
    followUpDate: 'Jul 24, 2026',
    templateVars: null,
    inviteSent: true,
    participantType: 'INVESTOR',
    accessLevel: 'L5',
  },
  {
    id: 'vova',
    name: 'Vova',
    email: 'vova.horin@magicpowered.io',
    avatarUrl: null,
    avatarPlaceholder: true,
    team: null,
    investorType: 'not provided',
    inviteAccepted: true,
    followUpsSent: 17,
    followUpDate: 'Aug 10, 2026',
    templateVars: '{"sector_hook":"energy"}',
    inviteSent: true,
    participantType: 'SUPPORT',
    accessLevel: 'L6',
  },
  {
    id: 'lee-fixel',
    name: 'Lee Fixel',
    email: 'lee.fixel@addition.com',
    avatarUrl: null,
    team: 'Addition',
    investorType: 'not provided',
    inviteAccepted: true,
    followUpsSent: 2,
    followUpDate: 'Jul 24, 2026',
    templateVars: '{"sector_hook":"energy and AI"}',
    inviteSent: true,
    participantType: 'INVESTOR',
    accessLevel: 'L5',
  },
  {
    id: 'dan-miller',
    name: 'Dan Miller',
    email: 'dan@rodagroup.com',
    avatarUrl: null,
    team: 'The Roda Group',
    investorType: 'Fund',
    inviteAccepted: false,
    followUpsSent: 2,
    followUpDate: 'Jul 24, 2026',
    templateVars: null,
    inviteSent: true,
    participantType: 'INVESTOR',
    accessLevel: 'L5',
  },
  {
    id: 'aaron-fyke',
    name: 'Aaron Fyke',
    email: 'aaron@thinlinecapital.com',
    avatarUrl: null,
    team: 'Thin Line Capital',
    investorType: 'Fund',
    inviteAccepted: false,
    followUpsSent: 2,
    followUpDate: 'Jul 24, 2026',
    templateVars: null,
    inviteSent: true,
    participantType: 'INVESTOR',
    accessLevel: 'L5',
  },
  {
    id: 'caroline-duffy',
    name: 'Caroline Duffy',
    email: 'caroline@cowboy.vc',
    avatarUrl: null,
    team: 'Cowboy VC',
    investorType: 'Fund',
    inviteAccepted: false,
    followUpsSent: 2,
    followUpDate: 'Jul 24, 2026',
    templateVars: '{"sector_hook":"AI"}',
    inviteSent: true,
    participantType: 'INVESTOR',
    accessLevel: 'L5',
  },
];
