import { resolveHopLabOs } from '@/components/page/investors/WarmIntrosV2Workspace/parseWarmPathHopChain';

describe('resolveHopLabOs', () => {
  it('resolves a member profile when memberUid is present', () => {
    expect(resolveHopLabOs({ memberUid: 'member-1', teamUid: null, name: 'Ilse Brandt' })).toEqual({
      type: 'member',
      uid: 'member-1',
      name: 'Ilse Brandt',
    });
  });

  it('resolves a team profile when only teamUid is present', () => {
    expect(resolveHopLabOs({ memberUid: null, teamUid: 'team-1', name: 'Synapse Foundry' })).toEqual({
      type: 'team',
      uid: 'team-1',
      name: 'Synapse Foundry',
    });
  });

  it('prefers memberUid when both memberUid and teamUid are present', () => {
    expect(resolveHopLabOs({ memberUid: 'member-1', teamUid: 'team-1', name: 'Ilse Brandt' })).toEqual({
      type: 'member',
      uid: 'member-1',
      name: 'Ilse Brandt',
    });
  });

  it('returns null when neither is present', () => {
    expect(resolveHopLabOs({ memberUid: null, teamUid: null, name: 'Protocol Labs' })).toBeNull();
    expect(resolveHopLabOs({ name: 'Protocol Labs' })).toBeNull();
  });
});
