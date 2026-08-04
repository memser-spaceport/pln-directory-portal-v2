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
 * Multi-select, with checkboxes. It was single-select at first, on the argument
 * that one selection keeps one legible trigger label — the control now shows a
 * count (`Path via · 2`) instead of the label, so that objection is spent.
 *
 * Several selections are matched as **OR** (see `PathFilters.pathVia`): ticking a
 * second box widens the result. The intersection would be the wrong reading and
 * usually empty, since a path has one shape and one bridge.
 */

import Select, { type GroupBase, type StylesConfig } from 'react-select';
import type { CSSObjectWithLabel } from 'react-select';
// The checkbox row and the settings that keep the menu still — shared with the
// Industry / Sector select, so both behave identically.
import { CheckboxOption, checkSelectStyles, steadyMenuProps } from './CheckSelect';
import type { Option } from '@/components/form/FormSelect/types';
import { MOCK_BRIDGES, MOCK_CONNECTORS, type PathVia, type PathViaFacets, type RelationKind } from './mocks';
// Same chevron as the other two selects in the bar, so the three still match.
import { dsIndicators } from './FilterSelectThin';

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
const groupedStyles: StylesConfig<Option, true, GroupBase<Option>> = {
  // Production's styles plus the placeholder-vs-value fix, shared with the
  // Industry / Sector select so a selected control looks the same in both.
  ...checkSelectStyles,
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
  /** Empty means unfiltered. Several values are matched as OR — see `PathFilters`. */
  value: PathVia[];
  onChange: (via: PathVia[]) => void;
}

export function PathViaSelect({ facets, value, onChange }: Props) {
  const groups = pathViaOptions(facets);
  const selected = value.map((via) => pathViaLabel(groups, via)).filter((opt): opt is Option => !!opt);

  return (
    <Select<Option, true, GroupBase<Option>>
      {...steadyMenuProps}
      aria-label="Path via"
      options={groups}
      value={selected}
      onChange={(opts) => onChange([...(opts ?? [])].map((opt) => decode(opt.value)).filter((v): v is PathVia => !!v))}
      // The control never renders the chosen values, so this doubles as the
      // summary line. Chips inside a 220px control wrap into two rows after the
      // second pick, and what is selected is already spelled out by the
      // active-filter pills under the bar — this would be the third time.
      placeholder={selected.length > 0 ? `Path via · ${selected.length}` : 'Path via'}
      isClearable
      isSearchable
      styles={groupedStyles}
      components={{ ...dsIndicators, Option: CheckboxOption }}
      menuPortalTarget={typeof document !== 'undefined' ? document.body : undefined}
      menuPosition="fixed"
      noOptionsMessage={() => 'No paths match the other filters'}
    />
  );
}
