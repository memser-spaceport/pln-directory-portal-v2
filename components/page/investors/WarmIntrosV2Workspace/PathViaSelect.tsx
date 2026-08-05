'use client';

/**
 * "Path via" — the mediation axis (path shape, PL member, or bridge person) as one
 * grouped, multi-select control. Replaces the old quick-filter chips + separate PL
 * member select, which asked "how does this intro get made" twice — once by shape,
 * once by person — with no visual link between the two.
 *
 * Multi-select, OR-matched: ticking a second box widens the result (see
 * WarmIntrosV2ListParams — the list endpoint OR-matches each group server-side).
 */

import { useMemo } from 'react';
import type { GroupBase } from 'react-select';
import { FilterMultiSelect } from '@/components/common/filters/FilterSelect/FilterMultiSelect';
import type { Option } from '@/components/form/FormSelect/types';
import type { WarmIntrosV2Facets, WarmIntrosV2PathRelationKind } from '@/services/investors/warm-intros-v2.types';

export type PathVia =
  | { type: 'kind'; value: WarmIntrosV2PathRelationKind }
  | { type: 'member'; value: string }
  | { type: 'bridge'; value: string };

const KIND_LABEL: Record<WarmIntrosV2PathRelationKind, string> = {
  pl_direct: 'Direct',
  founder_bridge: 'Via a founder',
  coinvestor_bridge: 'Via a co-investor',
};

const GROUP_LABEL = {
  kind: 'Path type',
  member: 'PL member',
  bridge: 'Founder / co-investor',
} as const;

/**
 * `member:mp-pl-mara` — the group is recoverable from the value alone. Internal to
 * this control only; the URL carries the three groups as separate typed params
 * (see usePathViaFilter), so this encoding never touches user-editable input.
 */
function encode(via: PathVia): string {
  return `${via.type}:${via.value}`;
}

function decode(raw: string): PathVia | null {
  const sep = raw.indexOf(':');
  if (sep < 0) return null;
  const type = raw.slice(0, sep);
  const value = raw.slice(sep + 1);
  if (!value) return null;
  if (type === 'kind') {
    return value === 'pl_direct' || value === 'founder_bridge' || value === 'coinvestor_bridge'
      ? { type: 'kind', value }
      : null;
  }
  if (type === 'member') return { type: 'member', value };
  if (type === 'bridge') return { type: 'bridge', value };
  return null;
}

const withCount = (label: string, count: number) => `${label} (${count})`;

function pathViaGroups(facets: WarmIntrosV2Facets): GroupBase<Option>[] {
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

  if (facets.connectors.length > 0) {
    groups.push({
      label: GROUP_LABEL.member,
      options: facets.connectors.map((m) => ({
        value: encode({ type: 'member', value: m.profileUid }),
        label: withCount(m.name, m.pathCount),
      })),
    });
  }

  if (facets.bridges.length > 0) {
    groups.push({
      label: GROUP_LABEL.bridge,
      options: facets.bridges.map((b) => ({
        value: encode({ type: 'bridge', value: b.profileUid }),
        label: withCount(b.name, b.pathCount),
      })),
    });
  }

  return groups;
}

interface Props {
  facets: WarmIntrosV2Facets;
  /** Empty means unfiltered. Several values are matched as OR within and across groups. */
  value: PathVia[];
  onChange: (via: PathVia[]) => void;
}

export function PathViaSelect({ facets, value, onChange }: Props) {
  const groups = useMemo(() => pathViaGroups(facets), [facets]);
  const selected = useMemo(() => {
    const keys = new Set(value.map(encode));
    return groups.flatMap((g) => g.options).filter((opt) => keys.has(opt.value));
  }, [groups, value]);

  return (
    <FilterMultiSelect
      groups={groups}
      value={selected}
      onChange={(opts) => onChange(opts.map((opt) => decode(opt.value)).filter((v): v is PathVia => v != null))}
      placeholder="Path via"
      isSearchable
      aria-label="Path via"
      checkbox
    />
  );
}
