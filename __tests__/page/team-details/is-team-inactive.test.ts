import { isTeamInactive } from '@/components/page/team-details/TeamDetails/utils/isTeamInactive';

describe('isTeamInactive', () => {
  it('is inactive only when explicitly marked INACTIVE', () => {
    expect(isTeamInactive({ status: 'INACTIVE' })).toBe(true);
  });

  it('treats an explicit ACTIVE as active', () => {
    expect(isTeamInactive({ status: 'ACTIVE' })).toBe(false);
  });

  it('treats a missing, null or absent status as active', () => {
    expect(isTeamInactive({ status: null })).toBe(false);
    expect(isTeamInactive({})).toBe(false);
    expect(isTeamInactive(undefined)).toBe(false);
    expect(isTeamInactive(null)).toBe(false);
  });
});
