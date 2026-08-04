'use client';

/**
 * "Path via" — the mediation axis as one grouped selector.
 *
 * Replaces dev's `PL member` select **and** its three path-kind chips. Those are
 * one question asked twice: the chips answer it coarsely (what shape), the select
 * answers it precisely (which person). Splitting them across two controls with
 * different affordances is what made the chips feel like facets when they are
 * really a pick-one — and what let clicking one silently clear another.
 *
 * Reused from production, not re-created:
 *   `FilterSelect`'s own react-select instance config and `filterSelectStyles`.
 * Only `group` / `groupHeading` are added — production never grouped, so those
 * two keys don't exist there. Everything else is imported verbatim, so the
 * control matches its neighbours in the filter bar exactly.
 *
 * Single-select on purpose. One selection = one legible trigger label; and
 * combinations like "founder bridges, but only Mara's" would need two values in
 * one control, which is the two-controls problem again wearing a new coat.
 */

import Select, { type GroupBase, type StylesConfig } from 'react-select';
import type { CSSObjectWithLabel } from 'react-select';
import { filterSelectStyles } from '@/components/common/filters/FilterSelect/filterSelectStyles';
import type { Option } from '@/components/form/FormSelect/types';
import { MOCK_BRIDGES, MOCK_CONNECTORS, type PathVia, type PathViaFacets, type RelationKind } from './mocks';
// Same chevron as the other two selects in the bar, so the three still match.
import { thinChevron } from './FilterSelectThin';

const KIND_LABEL: Record<RelationKind, string> = {
  pl_direct: 'Direct',
  founder_bridge: 'Via a founder',
  coinvestor_bridge: 'Via a co-investor',
};

const GROUP_LABEL = {
  kind: 'Path type',
  member: 'PL member',
  bridge: 'Founder / co-investor',
} as const;

/** `member:mp-pl-mara` — the group is recoverable from the value alone. */
function encode(via: PathVia): string {
  return `${via.type}:${via.value}`;
}

function decode(raw: string): PathVia | null {
  const [type, ...rest] = raw.split(':');
  const value = rest.join(':');
  if (!value) return null;
  if (type === 'kind') return { type: 'kind', value: value as RelationKind };
  if (type === 'member') return { type: 'member', value };
  if (type === 'bridge') return { type: 'bridge', value };
  return null;
}

const withCount = (label: string, count: number) => `${label} (${count})`;

export function pathViaOptions(facets: PathViaFacets): GroupBase<Option>[] {
  const groups: GroupBase<Option>[] = [];

  if (facets.kinds.length > 0) {
    groups.push({
      label: GROUP_LABEL.kind,
      options: facets.kinds.map((k) => ({
        value: encode({ type: 'kind', value: k.value }),
        label: withCount(KIND_LABEL[k.value], k.count),
      })),
    });
  }

  if (facets.members.length > 0) {
    groups.push({
      label: GROUP_LABEL.member,
      options: facets.members.map((m) => ({
        value: encode({ type: 'member', value: m.profileUid }),
        label: withCount(m.name, m.count),
      })),
    });
  }

  if (facets.bridges.length > 0) {
    groups.push({
      label: GROUP_LABEL.bridge,
      options: facets.bridges.map((b) => ({
        value: encode({ type: 'bridge', value: b.profileUid }),
        label: withCount(b.name, b.count),
      })),
    });
  }

  return groups;
}

/**
 * A selection's name, resolved from the data rather than from the current facet
 * list — the active-filter pill has to stay readable even when the other filters
 * would have dropped that option from the menu.
 */
export function describePathVia(via: PathVia): string {
  if (via.type === 'kind') return KIND_LABEL[via.value];
  const source = via.type === 'member' ? MOCK_CONNECTORS : MOCK_BRIDGES;
  return Object.values(source).find((p) => p.profileUid === via.value)?.name ?? via.value;
}

/** The trigger's label for a live selection — resolved against the same groups. */
export function pathViaLabel(groups: GroupBase<Option>[], via: PathVia | null): Option | null {
  if (!via) return null;
  const key = encode(via);
  for (const group of groups) {
    const hit = group.options.find((o) => o.value === key);
    if (hit) return hit;
  }
  return null;
}

/**
 * Production's styles plus the two keys it never needed. Colours are lifted from
 * `filterSelectStyles`' own palette so the headings read as the same family.
 */
const groupedStyles: StylesConfig<Option, false, GroupBase<Option>> = {
  ...(filterSelectStyles as StylesConfig<Option, false, GroupBase<Option>>),
  group: (base: CSSObjectWithLabel) => ({ ...base, paddingTop: 4, paddingBottom: 4 }),
  groupHeading: (base: CSSObjectWithLabel) => ({
    ...base,
    fontSize: '11px',
    fontWeight: 600,
    letterSpacing: '0.02em',
    textTransform: 'none',
    color: '#8897ae',
    paddingTop: 6,
    paddingBottom: 2,
  }),
};

interface Props {
  facets: PathViaFacets;
  value: PathVia | null;
  onChange: (via: PathVia | null) => void;
}

export function PathViaSelect({ facets, value, onChange }: Props) {
  const groups = pathViaOptions(facets);

  return (
    <Select<Option, false, GroupBase<Option>>
      aria-label="Path via"
      options={groups}
      value={pathViaLabel(groups, value)}
      onChange={(opt) => onChange(opt ? decode(opt.value) : null)}
      placeholder="Path via"
      isClearable
      isSearchable
      styles={groupedStyles}
      components={thinChevron}
      menuPortalTarget={typeof document !== 'undefined' ? document.body : undefined}
      menuPosition="fixed"
      noOptionsMessage={() => 'No paths match the other filters'}
    />
  );
}
