import { mergeLegacyPathVia } from '@/components/page/investors/WarmIntrosV2Workspace/usePathViaFilter';

const base = {
  wi2_path_kind: [],
  wi2_path_members: [],
  wi2_path_bridges: [],
  wi2_direct_only: null,
  wi2_relation_kind: null,
  wi2_connector: '',
} as const;

describe('mergeLegacyPathVia', () => {
  it('does nothing once the new shape is already present', () => {
    expect(mergeLegacyPathVia({ ...base, wi2_path_kind: ['pl_direct'] })).toBeNull();
    expect(mergeLegacyPathVia({ ...base, wi2_path_members: ['mp-1'] })).toBeNull();
    expect(mergeLegacyPathVia({ ...base, wi2_path_bridges: ['mp-2'] })).toBeNull();
  });

  it('does nothing when there is no legacy value to fold in', () => {
    expect(mergeLegacyPathVia(base)).toBeNull();
  });

  it('folds legacy wi2_relation_kind into the kind group', () => {
    expect(mergeLegacyPathVia({ ...base, wi2_relation_kind: 'founder_bridge' })).toEqual({
      kind: ['founder_bridge'],
      members: [],
    });
  });

  it('folds legacy wi2_direct_only into a pl_direct kind, taking priority over relationKind', () => {
    expect(mergeLegacyPathVia({ ...base, wi2_direct_only: true, wi2_relation_kind: 'founder_bridge' })).toEqual({
      kind: ['pl_direct'],
      members: [],
    });
  });

  it('folds legacy wi2_connector into the members group', () => {
    expect(mergeLegacyPathVia({ ...base, wi2_connector: 'mp-pl-mara' })).toEqual({
      kind: [],
      members: ['mp-pl-mara'],
    });
  });

  it('folds both a legacy kind and a legacy connector together', () => {
    expect(mergeLegacyPathVia({ ...base, wi2_relation_kind: 'coinvestor_bridge', wi2_connector: 'mp-pl-mara' })).toEqual({
      kind: ['coinvestor_bridge'],
      members: ['mp-pl-mara'],
    });
  });
});
