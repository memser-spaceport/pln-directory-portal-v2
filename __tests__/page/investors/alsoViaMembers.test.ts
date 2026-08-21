import { alsoViaMembers } from '@/components/page/investors/WarmIntrosV2Workspace/alsoViaMembers';

const JUAN = { uid: 'mp-juan', name: 'Juan Benet' };
const LACEY = { uid: 'mp-lacey', name: 'Lacey Wisdom' };

describe('alsoViaMembers', () => {
  it('names a selected member who is only an alternate connector', () => {
    expect(
      alsoViaMembers({ bestConnectorProfileUid: 'mp-marc', alternateConnectorProfileUids: ['mp-juan'] }, [JUAN]),
    ).toEqual(['Juan Benet']);
  });

  it('stays quiet when the selected member is already the visible best connector', () => {
    expect(
      alsoViaMembers({ bestConnectorProfileUid: 'mp-juan', alternateConnectorProfileUids: ['mp-juan'] }, [JUAN]),
    ).toEqual([]);
  });

  it('names only the members that actually match this row', () => {
    expect(
      alsoViaMembers({ bestConnectorProfileUid: 'mp-marc', alternateConnectorProfileUids: ['mp-juan'] }, [
        JUAN,
        LACEY,
      ]),
    ).toEqual(['Juan Benet']);
  });

  it('returns nothing when no member filter is active', () => {
    expect(
      alsoViaMembers({ bestConnectorProfileUid: 'mp-marc', alternateConnectorProfileUids: ['mp-juan'] }, []),
    ).toEqual([]);
  });

  // alternateConnectorProfileUids is typed `unknown` — it arrives as raw JSON.
  it('survives a non-array or ragged alternates payload', () => {
    expect(alsoViaMembers({ bestConnectorProfileUid: 'mp-marc', alternateConnectorProfileUids: null }, [JUAN])).toEqual(
      [],
    );
    expect(
      alsoViaMembers({ bestConnectorProfileUid: 'mp-marc', alternateConnectorProfileUids: [null, 7, 'mp-juan'] }, [
        JUAN,
      ]),
    ).toEqual(['Juan Benet']);
  });
});
