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
  kind: 'founder' | 'team' | 'investor';
  displayLabel: string;
  matchLabels: string[];
  containsLabels?: string[];
};

interface Props {
  /** Portfolio teams (with founders[]) for the local founder/team group. */
  teams: PlPortfolioTeam[] | undefined;
  onSelect: (sel: UnifiedSelection) => void;
}

const MAX_LOCAL = 6;

type LocalRow = {
  kind: 'founder' | 'team';
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
            matchLabels: [f.name],
            sub: `Founder · ${t.team_name}`,
            key: `founder-${t.team_id}-${f.member_uid || f.name}`,
          });
        }
      });
    });
    return rows.slice(0, MAX_LOCAL);
  }, [teams, term]);

  // Flattened, navigable list: founders/teams first, then investors/funds.
  const flat = useMemo(
    () => [
      ...localRows.map((r) => ({ type: 'local' as const, row: r })),
      ...investorItems.map((inv) => ({ type: 'investor' as const, inv })),
    ],
    [localRows, investorItems],
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
      const matchLabels = [displayLabel, entry.inv.firm].filter((l): l is string => !!l?.trim());
      onSelect({ kind: 'investor', displayLabel, matchLabels });
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
        placeholder="Search an investor, fund, founder or team…"
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

          {localRows.length > 0 && (
            <>
              <div className={s.groupLabel}>Founders / Teams</div>
              {localRows.map((r, i) => (
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
