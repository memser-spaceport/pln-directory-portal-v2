/**
 * Mocked data + draft-key namespace for the input-interactions prototype.
 *
 * Every draft key is prefixed `form-draft:proto:input-interactions:` so this
 * prototype can never collide with (or resurrect into) a real production draft.
 */

export const DRAFT_KEYS = {
  inlineComment: 'form-draft:proto:input-interactions:inline-comment',
  pagePost: 'form-draft:proto:input-interactions:page-post',
  feedbackModal: 'form-draft:proto:input-interactions:feedback-modal',
  notePopover: 'form-draft:proto:input-interactions:note-popover',
} as const;

export const ALL_DRAFT_KEYS = Object.values(DRAFT_KEYS);

export const mockPage = {
  title: 'Input interactions — autosave & dismissal',
  description:
    'One contract for every place a member types. Flip each demo between what ships today and the proposed behaviour, then reload the page: the proposed side always brings your text back.',
};

/** The four rules the proposed behaviour is built from. */
export const CONTRACT = [
  {
    id: 'inert',
    label: 'Outside click never destroys text',
    detail:
      'While a field holds unsaved text, the backdrop is inert. Clicking it nudges the surface instead of closing it.',
  },
  {
    id: 'autosave',
    label: 'Autosave is continuous and visible',
    detail: 'Debounced 500ms to localStorage, with a status chip so the member can see it happened.',
  },
  {
    id: 'explicit',
    label: 'Discard is always explicit',
    detail: 'Cancel or × on a dirty field opens a Keep / Discard step. Nothing is thrown away silently.',
  },
  {
    id: 'restore',
    label: 'Drafts survive reload and restore on reopen',
    detail: 'Reopening shows a "Draft restored" acknowledgement that fades after a few seconds.',
  },
] as const;

export const mockPost = {
  author: 'Dana Whitfield',
  authorRole: 'Protocol Labs · Network Ops',
  title: 'How are teams handling multi-region deploys this quarter?',
  excerpt:
    'We are seeing a lot of duplicated effort across teams standing up their own regional failover. Curious what patterns people have landed on.',
  replies: 12,
};

export const mockComments = [
  {
    id: 'c1',
    author: 'Marco Silva',
    body: 'We moved to a single control plane with regional workers — happy to write up the migration if useful.',
    when: '2h ago',
  },
  {
    id: 'c2',
    author: 'Priya Raman',
    body: 'Same here. The tricky part was secrets rotation across regions, not the deploy itself.',
    when: '40m ago',
  },
];

export const mockTopics = [
  { label: 'General', value: 'general' },
  { label: 'Infrastructure', value: 'infra' },
  { label: 'Hiring', value: 'hiring' },
];

/** Surfaces this prototype stands in for, shown in the coverage footer. */
export const COVERED_SURFACES = [
  {
    tier: 'Tier 1',
    demo: 'Inline composer',
    surfaces: ['Forum comment / reply', 'Guides comment', 'Husky chat input'],
  },
  {
    tier: 'Tier 1',
    demo: 'Page composer',
    surfaces: ['Forum create / edit post', 'Guides create article'],
  },
  {
    tier: 'Tier 2',
    demo: 'Modal with text',
    surfaces: [
      'Contact support',
      'Demo Day give feedback / refer company',
      'Deals report a problem',
      'Husky feedback',
      'Office-hours rating',
    ],
  },
  {
    tier: 'Tier 2',
    demo: 'Anchored popover',
    surfaces: ['Gantry decline reason', 'Gantry pin note', 'Asks add / edit'],
  },
] as const;
