import { plBackingLabel } from '@/components/page/investors/PlBackingMark/PlBackingMark';

describe('plBackingLabel', () => {
  it('labels a PL-only backer', () => {
    expect(plBackingLabel({ backedProtocolLabs: true, backedFilecoin: false, matchKind: 'person' })).toBe(
      'Backed PL',
    );
  });

  it('labels a Filecoin-only backer', () => {
    expect(plBackingLabel({ backedProtocolLabs: false, backedFilecoin: true, matchKind: 'firm' })).toBe(
      'Backed Filecoin',
    );
  });

  it('labels a backer of both — never bare "backer"', () => {
    expect(plBackingLabel({ backedProtocolLabs: true, backedFilecoin: true, matchKind: 'person' })).toBe(
      'Backed PL + FIL',
    );
  });

  it('returns null when neither flag is set', () => {
    expect(plBackingLabel({ backedProtocolLabs: false, backedFilecoin: false, matchKind: 'person' })).toBeNull();
  });

  it('returns null for null/undefined backing', () => {
    expect(plBackingLabel(null)).toBeNull();
    expect(plBackingLabel(undefined)).toBeNull();
  });
});
