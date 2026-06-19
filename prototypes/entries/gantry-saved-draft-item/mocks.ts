import type { Option } from '@/components/form/FormSelect/types';
import type { SubmitIdeaFormData } from '@/components/page/gantry/ideas/SubmitIdeaModal/helpers';
import type { GantryItem, GantryItemType, GantryObjective } from '@/services/gantry/types';

export type MockSaveStatus = 'idle' | 'saving' | 'saved';

export interface MockSavedGantryDraft {
  uid: string;
  form: SubmitIdeaFormData;
  updatedAtLabel: string;
  createdBy: {
    uid: string;
    name: string;
    imageUrl: string | null;
  };
}

const submittedStageOption: Option = { label: 'Submitted', value: 'IDEA' };

const plannedStageOption: Option = { label: 'Planned', value: 'PLANNED' };

const enhancementTypeOption: Option = {
  label: 'Enhancement Request',
  value: 'Enhancement Request',
};

const gantryTagOption: Option = { label: 'Gantry', value: 'Gantry' };

const notificationsTagOption: Option = {
  label: 'Notifications',
  value: 'Notifications',
};

export const mockGantryObjectives: GantryObjective[] = [
  {
    uid: 'mock-objective-1',
    order: 1,
    title: 'Improve contributor request flow',
    itemCount: 5,
    createdAt: '2026-05-20T09:00:00.000Z',
  },
  {
    uid: 'mock-objective-2',
    order: 2,
    title: 'Increase roadmap visibility',
    itemCount: 3,
    createdAt: '2026-06-01T09:00:00.000Z',
  },
];

export const mockObjectiveOptions: Option[] = mockGantryObjectives.map((objective) => ({
  label: `O${objective.order} - ${objective.title}`,
  value: objective.uid,
}));

export const mockSavedGantryDraft: MockSavedGantryDraft = {
  uid: 'mock-draft-gantry-item',
  updatedAtLabel: '2 min ago',
  createdBy: {
    uid: 'mock-member-current',
    name: 'Maya Chen',
    imageUrl: null,
  },
  form: {
    title: 'Show saved Gantry request drafts in filters',
    description:
      '<p>When I start adding a board item, I need visible confirmation that the draft is saved before I publish it.</p>',
    stage: submittedStageOption,
    tags: [gantryTagOption, notificationsTagOption],
    type: enhancementTypeOption,
    objective: mockObjectiveOptions[1],
  },
};

export const mockEmptyGantryForm: SubmitIdeaFormData = {
  title: '',
  description: '',
  stage: plannedStageOption,
  tags: [],
  type: null,
  objective: null,
};

export const mockBoardItems: GantryItem[] = [
  {
    uid: 'mock-gantry-item-1',
    title: 'Export filtered member lists to CSV',
    description:
      '<p>Allow PL Infra admins to export filtered member directory results as CSV for offline review and reporting workflows.</p>',
    acceptanceCriteria: null,
    stage: 'PLANNED',
    focusArea: null,
    objective: {
      uid: 'mock-objective-2',
      order: 2,
      title: 'Increase roadmap visibility',
    },
    tags: ['Directory', 'Back Office'],
    type: 'Enhancement Request',
    order: 1,
    createdByUid: 'mock-member-1',
    createdBy: {
      uid: 'mock-member-1',
      name: 'Alex Rivera',
      imageUrl: null,
    },
    promotedAt: '2026-06-03T12:00:00.000Z',
    promotedByUid: 'mock-admin-1',
    declinedReason: null,
    externalTrackerUrl: null,
    upvoteCount: 18,
    viewerHasUpvoted: false,
    pinCount: 12,
    viewerHasPinned: false,
    viewerPinNote: null,
    deletedAt: null,
    createdAt: '2026-05-26T14:00:00.000Z',
    updatedAt: '2026-06-03T12:00:00.000Z',
  },
  {
    uid: 'mock-gantry-item-2',
    title: 'Add request owner to Gantry cards',
    description:
      '<p>Show the person responsible for follow-up directly on the board so members know who to contact.</p>',
    acceptanceCriteria: null,
    stage: 'IN_PROGRESS',
    focusArea: null,
    objective: {
      uid: 'mock-objective-1',
      order: 1,
      title: 'Improve contributor request flow',
    },
    tags: ['Gantry', 'Notifications'],
    type: 'New Feature Request',
    order: 1,
    createdByUid: 'mock-member-2',
    createdBy: {
      uid: 'mock-member-2',
      name: 'Sam Taylor',
      imageUrl: null,
    },
    promotedAt: '2026-05-28T12:00:00.000Z',
    promotedByUid: 'mock-admin-1',
    declinedReason: null,
    externalTrackerUrl: null,
    upvoteCount: 24,
    viewerHasUpvoted: true,
    pinCount: 8,
    viewerHasPinned: true,
    viewerPinNote: 'Helps our team know where to route questions.',
    deletedAt: null,
    createdAt: '2026-05-18T14:00:00.000Z',
    updatedAt: '2026-06-05T12:00:00.000Z',
  },
  {
    uid: 'mock-gantry-item-3',
    title: 'Clarify what happens after a request ships',
    description:
      '<p>Add a lightweight post-ship note so requesters can understand the final outcome without opening Linear.</p>',
    acceptanceCriteria: null,
    stage: 'SHIPPED',
    focusArea: null,
    objective: null,
    tags: ['Gantry'],
    type: 'Enhancement Request',
    order: 1,
    createdByUid: 'mock-member-3',
    createdBy: {
      uid: 'mock-member-3',
      name: 'Priya Shah',
      imageUrl: null,
    },
    promotedAt: '2026-04-30T12:00:00.000Z',
    promotedByUid: 'mock-admin-1',
    declinedReason: null,
    externalTrackerUrl: null,
    upvoteCount: 15,
    viewerHasUpvoted: false,
    pinCount: 5,
    viewerHasPinned: false,
    viewerPinNote: null,
    deletedAt: null,
    createdAt: '2026-04-18T14:00:00.000Z',
    updatedAt: '2026-06-10T12:00:00.000Z',
  },
  {
    uid: 'mock-gantry-item-4',
    title: 'Group duplicate Gantry needs before planning',
    description: '<p>Let curators merge overlapping requests so members support the strongest version of a need.</p>',
    acceptanceCriteria: null,
    stage: 'IDEA',
    focusArea: null,
    objective: {
      uid: 'mock-objective-1',
      order: 1,
      title: 'Improve contributor request flow',
    },
    tags: ['Gantry', 'Search'],
    type: 'New Feature Request',
    order: null,
    createdByUid: 'mock-member-4',
    createdBy: {
      uid: 'mock-member-4',
      name: 'Jordan Lee',
      imageUrl: null,
    },
    promotedAt: null,
    promotedByUid: null,
    declinedReason: null,
    externalTrackerUrl: null,
    upvoteCount: 9,
    viewerHasUpvoted: false,
    pinCount: 4,
    viewerHasPinned: false,
    viewerPinNote: null,
    deletedAt: null,
    createdAt: '2026-06-12T14:00:00.000Z',
    updatedAt: '2026-06-12T14:00:00.000Z',
  },
];

export const mockCurrentUser = {
  uid: 'mock-member-current',
  name: 'Maya Chen',
  imageUrl: null,
};

export const mockSupportedTypes: GantryItemType[] = ['Bug Report', 'Enhancement Request', 'New Feature Request'];
