'use client';

import { useMemo, useRef, useState } from 'react';
import clsx from 'clsx';
import { useDebounce } from '@/hooks/useDebounce';
import { useOnClickOutside } from '@/hooks/useOnClickOutside';
import { useSearchInvestors } from '@/services/investors/hooks/useSearchInvestors';
import type { PlPortfolioTeam } from '@/services/investors/types';
import s from './WorkspaceTypeahead.module.scss';

/** Chosen typeahead result — all kinds apply the connector-lens table filter. */
export type UnifiedSelection = {
  kind: 'founder' | 'team' | 'investor' | 'pl_team';
  displayLabel: string;
  matchLabels: string[];
  containsLabels?: string[];
};

/**
 * PL Capital venture leads, searchable as connector-lens targets (task 04).
 * Names MUST equal the `hopChain.plConnector.name` written by the relationship
 * seed (task 01) — the backend match is exact (lowercased) on that field. Exact
 * match only (no contains) so a lead name never accidentally hits a node label.
 */
const PL_TEAM_MEMBERS = [
  'Marc Johnson',
  'Brad Holden',
  'Lacey Wisdom',
  'Charlotte Kapoor',
  'Christina DesVaux',
  'Juan Benet',
] as const;

interface Props {
  /** Portfolio teams (with founders[]) for the local founder/team group. */
  teams: PlPortfolioTeam[] | undefined;
  onSelect: (sel: UnifiedSelection) => void;
}

const MAX_LOCAL = 6;

type LocalRow = {
  kind: 'founder' | 'team' | 'pl_team';
  displayLabel: string;
  matchLabels: string[];
  containsLabels?: string[];
  sub: string;
  key: string;
};

/**
 * One unified typeahead merging the two previous search bars. Results are
 * grouped: Investors / Funds (async over the investor DB) and Founders / Teams
 * (client-side over the co-investor teams, incl. each team's founders[]).
 * Mirrors the member-profile author autocomplete (debounced, click-outside,
 * keyboard nav).
 */
export function UnifiedSearchSelect({ teams, onSelect }: Props) {
  const [term, setTerm] = useState('');
  const [open, setOpen] = useState(false);
  const [hi, setHi] = useState(-1);
  const ref = useRef<HTMLDivElement>(null);
  const debounced = useDebounce(term, 300);

  useOnClickOutside([ref], () => {
    setOpen(false);
    setHi(-1);
  });

  const { data, isPending } = useSearchInvestors(debounced, open);
  const investorItems = data?.items ?? [];
  const searching = debounced.trim().length >= 2;

  // Founders + teams, filtered client-side by the live term (no debounce needed).
  const localRows = useMemo<LocalRow[]>(() => {
    const q = term.trim().toLowerCase();
    if (q.length < 2) return [];
    const rows: LocalRow[] = [];
    (teams ?? []).forEach((t) => {
      const founderNames = t.founders.map((f) => f.name).filter(Boolean);
      if (t.team_name.toLowerCase().includes(q)) {
        rows.push({
          kind: 'team',
          displayLabel: t.team_name,
          matchLabels: [t.team_name, ...founderNames],
          containsLabels: [t.team_name],
          sub: 'Portfolio team',
          key: `team-${t.team_id}`,
        });
      }
      t.founders.forEach((f) => {
        if (f.name.toLowerCase().includes(q)) {
          rows.push({
            kind: 'founder',
            displayLabel: f.name,
            matchLabels: [f.name, t.team_name],
            containsLabels: [t.team_name],
            sub: `Founder · ${t.team_name}`,
            key: `founder-${t.team_id}-${f.member_uid || f.name}`,
          });
        }
      });
    });
    return rows.slice(0, MAX_LOCAL);
  }, [teams, term]);

  // PL Capital venture leads, filtered client-side by the live term (task 04).
  const plTeamRows = useMemo<LocalRow[]>(() => {
    const q = term.trim().toLowerCase();
    if (q.length < 2) return [];
    return PL_TEAM_MEMBERS.filter((name) => name.toLowerCase().includes(q)).map((name) => ({
      kind: 'pl_team',
      displayLabel: name,
      matchLabels: [name], // exact-name match on hopChain.plConnector.name
      sub: 'PL team',
      key: `pl-team-${name}`,
    }));
  }, [term]);

  // Flattened, navigable list — render order: PL team, then founders/teams, then
  // investors/funds. Indices below derive offsets from this same order.
  const flat = useMemo(
    () => [
      ...plTeamRows.map((r) => ({ type: 'local' as const, row: r })),
      ...localRows.map((r) => ({ type: 'local' as const, row: r })),
      ...investorItems.map((inv) => ({ type: 'investor' as const, inv })),
    ],
    [plTeamRows, localRows, investorItems],
  );

  const reset = () => {
    setTerm('');
    setOpen(false);
    setHi(-1);
  };

  const pick = (i: number) => {
    const entry = flat[i];
    if (!entry) return;
    if (entry.type === 'local') {
      const { kind, displayLabel, matchLabels, containsLabels } = entry.row;
      onSelect({ kind, displayLabel, matchLabels, containsLabels });
    } else {
      const displayLabel = `${entry.inv.first_name} ${entry.inv.last_name}`.trim();
      const firm = entry.inv.firm?.trim();
      const matchLabels = [displayLabel, firm].filter((l): l is string => !!l);
      const containsLabels = firm ? [firm] : [];
      onSelect({ kind: 'investor', displayLabel, matchLabels, containsLabels });
    }
    reset();
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!open) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHi((p) => (p < flat.length - 1 ? p + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHi((p) => (p > 0 ? p - 1 : flat.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (hi >= 0 && hi < flat.length) pick(hi);
    } else if (e.key === 'Escape') {
      setOpen(false);
      setHi(-1);
    }
  };

  // Derive localCount from the merged flat array so the investor-segment offset
  // is always consistent with what flat actually contains, even during the debounce
  // window when localRows and investorItems reflect different terms.
  const localCount = flat.filter((e) => e.type === 'local').length;

  return (
    <div className={s.wrap} ref={ref}>
      <input
        className={s.input}
        type="search"
        placeholder="Search investor, fund, or founder"
        value={term}
        onChange={(e) => {
          setTerm(e.target.value);
          if (!open) setOpen(true);
          setHi(-1);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
      />
      {open && (
        <div className={s.dropdown}>
          {!searching && localCount === 0 && <div className={s.hint}>Type at least 2 characters to search</div>}

          {plTeamRows.length > 0 && (
            <>
              <div className={s.groupLabel}>PL team</div>
              {plTeamRows.map((r, i) => (
                <div
                  key={r.key}
                  className={clsx(s.option, i === hi && s.highlighted)}
                  onClick={() => pick(i)}
                  onMouseEnter={() => setHi(i)}
                >
                  <span className={s.optName}>{r.displayLabel}</span>
                  <span className={s.optSub}>{r.sub}</span>
                </div>
              ))}
            </>
          )}

          {localRows.length > 0 && (
            <>
              <div className={s.groupLabel}>Founders / Teams</div>
              {localRows.map((r, i) => {
                const idx = plTeamRows.length + i;
                return (
                  <div
                    key={r.key}
                    className={clsx(s.option, idx === hi && s.highlighted)}
                    onClick={() => pick(idx)}
                    onMouseEnter={() => setHi(idx)}
                  >
                    <span className={s.optName}>{r.displayLabel}</span>
                    <span className={s.optSub}>{r.sub}</span>
                  </div>
                );
              })}
            </>
          )}

          {searching && <div className={s.groupLabel}>Investors / Funds</div>}
          {searching && isPending && <div className={s.hint}>Searching…</div>}
          {searching && !isPending && investorItems.length === 0 && <div className={s.hint}>No investors found</div>}
          {searching &&
            !isPending &&
            investorItems.map((inv, j) => {
              const idx = localCount + j;
              return (
                <div
                  key={inv.investor_id}
                  className={clsx(s.option, idx === hi && s.highlighted)}
                  onClick={() => pick(idx)}
                  onMouseEnter={() => setHi(idx)}
                >
                  <span className={s.optName}>
                    {inv.first_name} {inv.last_name}
                  </span>
                  <span className={s.optSub}>{inv.firm || inv.email}</span>
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
}
