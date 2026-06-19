'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import clsx from 'clsx';
// Reuse the production typeahead styling, with a prototype overlay that adds a
// search icon + on-scale type (a DS improvement to spec back to production).
import { SearchIcon } from '@/components/icons';
import s from '@/components/page/investors/WarmIntrosWorkspace/WorkspaceTypeahead.module.scss';
import x from './WarmIntrosImprovements.module.scss';
import { MOCK_MEMBERS } from './mocks';

type Row = { label: string; sub: string; kind: 'team' | 'founder' | 'investor' };

interface Props {
  onSelect: (label: string) => void;
}

// Mocked unified search: founders/teams (from portfolio paths) + investors/funds
// (the list members). Mirrors production UnifiedSearchSelect's grouped dropdown.
function buildIndex(): { local: Row[]; investors: Row[] } {
  const teams = new Map<string, Row>();
  const founders = new Map<string, Row>();
  MOCK_MEMBERS.forEach((m) =>
    m.paths.forEach((p) => {
      if (p.team) teams.set(p.team.name, { label: p.team.name, sub: 'Portfolio team', kind: 'team' });
      if (p.connector_type === 'F' && p.contact?.memberUid) {
        founders.set(p.contact.name, { label: p.contact.name, sub: p.contact.role, kind: 'founder' });
      }
    }),
  );
  const local = [...teams.values(), ...founders.values()];
  const investors: Row[] = MOCK_MEMBERS.map((m) => ({
    label: `${m.first_name} ${m.last_name}`,
    sub: m.firm,
    kind: 'investor',
  }));
  return { local, investors };
}

export function WorkspaceSearch({ onSelect }: Props) {
  const [term, setTerm] = useState('');
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { local, investors } = useMemo(buildIndex, []);

  // Shorter placeholder on phones — the full prompt is clipped on narrow inputs.
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 639px)');
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  const q = term.trim().toLowerCase();
  const searching = q.length >= 2;
  const localHits = searching ? local.filter((r) => r.label.toLowerCase().includes(q)) : [];
  const investorHits = searching ? investors.filter((r) => r.label.toLowerCase().includes(q)) : [];

  const pick = (label: string) => {
    onSelect(label);
    setTerm('');
    setOpen(false);
  };

  return (
    <div className={clsx(s.wrap, x.searchWrap)} ref={ref}>
      <span className={x.searchIcon} aria-hidden>
        <SearchIcon />
      </span>
      <input
        className={clsx(s.input, x.searchInput)}
        type="search"
        placeholder={isMobile ? 'Search…' : 'Search an investor, fund, founder or team…'}
        value={term}
        onChange={(e) => {
          setTerm(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 120)}
      />
      {open && (
        <div className={s.dropdown}>
          {!searching && <div className={s.hint}>Type at least 2 characters to search</div>}
          {localHits.length > 0 && <div className={s.groupLabel}>Founders / Teams</div>}
          {localHits.map((r) => (
            <div key={`l-${r.label}`} className={clsx(s.option)} onMouseDown={() => pick(r.label)}>
              <span className={s.optName}>{r.label}</span>
              <span className={s.optSub}>{r.sub}</span>
            </div>
          ))}
          {searching && <div className={s.groupLabel}>Investors / Funds</div>}
          {searching && investorHits.length === 0 && <div className={s.hint}>No investors found</div>}
          {investorHits.map((r) => (
            <div key={`i-${r.label}`} className={clsx(s.option)} onMouseDown={() => pick(r.label)}>
              <span className={s.optName}>{r.label}</span>
              <span className={s.optSub}>{r.sub}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
