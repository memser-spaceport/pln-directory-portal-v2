export type MockPriority = 'low' | 'medium' | 'high';

export type MockMoSCoW = 'could' | 'should' | 'must';

export interface MockGantryItem {
  uid: string;
  title: string;
  description: string;
  upvoteCount: number;
  avgPriority: number | null;
  priorityDistribution: { low: number; medium: number; high: number };
  createdBy: {
    uid: string;
    name: string;
    imageUrl: string | null;
  };
}

export const mockGantryItem: MockGantryItem = {
  uid: 'proto-item-1',
  title: 'Export member lists to CSV',
  description:
    'Allow PL Infra admins to export filtered member directory results as CSV for offline review and reporting workflows.',
  upvoteCount: 12,
  avgPriority: 2.4,
  priorityDistribution: { low: 2, medium: 5, high: 5 },
  createdBy: {
    uid: 'member-1',
    name: 'Alex Rivera',
    imageUrl: null,
  },
};

export const PRIORITY_LABELS: Record<MockPriority, string> = {
  low: 'Nice to have',
  medium: 'Important',
  high: 'Blocker',
};

export const MOSCow_LABELS: Record<MockMoSCoW, string> = {
  could: 'Could have',
  should: 'Should have',
  must: 'Must have',
};

export const TOKEN_BUDGET_TOTAL = 10;

export const TOKEN_COST: Record<MockPriority, number> = {
  low: 1,
  medium: 2,
  high: 4,
};
