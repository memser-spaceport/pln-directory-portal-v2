import { getMemberMeta } from '@/prototypes/entries/job-board/components/ReferModal/utils/getMemberMeta';
import { toRecipientOption } from '@/prototypes/entries/job-board/components/ReferModal/utils/toRecipientOption';
import type { DirectoryMember } from '@/prototypes/entries/job-board/components/ReferModal/types';

const member = (overrides: Partial<DirectoryMember> = {}): DirectoryMember => ({
  uid: 'm1',
  name: 'Ada Lovelace',
  title: 'Staff Engineer',
  team: 'Filecoin Foundation',
  image: null,
  ...overrides,
});

describe('getMemberMeta', () => {
  it('joins title and team', () => {
    expect(getMemberMeta(member())).toBe('Staff Engineer · Filecoin Foundation');
  });

  it('prefixes Team Lead when the member leads the hiring team', () => {
    expect(getMemberMeta(member({ isTeamLead: true }))).toBe('Team Lead · Staff Engineer · Filecoin Foundation');
  });

  it('returns Team Lead alone when title and team are missing', () => {
    expect(getMemberMeta(member({ title: '', team: '', isTeamLead: true }))).toBe('Team Lead');
  });

  it('returns undefined when there is nothing to show', () => {
    expect(getMemberMeta(member({ title: '', team: '' }))).toBeUndefined();
  });
});

describe('toRecipientOption', () => {
  it('carries isTeamLead onto the picker option', () => {
    expect(toRecipientOption(member({ isTeamLead: true })).isTeamLead).toBe(true);
    expect(toRecipientOption(member()).isTeamLead).toBeUndefined();
  });
});
