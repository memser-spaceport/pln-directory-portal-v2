'use client';

// Dev reference gallery: every node state and every warm-path card state in one
// place. Reuses the SAME production-tracking components the prototype uses
// (PeopleChain for the chain nodes, WarmPathPanel for the full path cards) fed
// with crafted mock routes — so this page can never drift from the real thing.
import { useEffect, useState } from 'react';
import { PeopleChain } from './PeopleChain';
import { WarmPathPanel } from './WarmPathPanel';
import { MOCK_MEMBERS } from './mocks';
import type { MockInvestor, MockPath, PathRoute, RouteNode } from './mocks';
import x from './WarmIntrosImprovements.module.scss';
import g from './WarmPathStates.module.scss';

// ── Single node states (rendered as one-node chains) ──────────────────────────
const NODE_STATES: { label: string; note: string; nodes: RouteNode[] }[] = [
  {
    label: 'PL — known teammate',
    note: 'Protocol Labs logomark + the teammate’s name. No link (reached internally).',
    nodes: [{ pl: true, variant: 'member', label: 'Daniel Roth', memberUid: 'daniel-roth' }],
  },
  {
    label: 'PL — person unknown',
    note: 'PL can route it, but we don’t know which teammate yet. No “?” — the mark says PL.',
    nodes: [{ pl: true, plUnknown: true, variant: 'org', label: 'Protocol Labs' }],
  },
  {
    label: 'Connector — in PL network',
    note: 'Generated avatar + name, links to /members.',
    nodes: [{ variant: 'member', label: 'Alicia Mer', memberUid: 'alicia-mer' }],
  },
  {
    label: 'Connector — known, not in network',
    note: 'Grey person glyph + name, no link.',
    nodes: [{ variant: 'external', label: 'James Whitfield' }],
  },
  {
    label: 'Org — PL-network team (person unknown)',
    note: 'Real logo + name, links to /teams, with a “?” (who specifically is unknown).',
    nodes: [{ variant: 'org', label: 'Modular Globe', teamUid: 'modular-globe' }],
  },
  {
    label: 'Org — external firm (person unknown)',
    note: 'Dashed chip + building glyph + “?”.',
    nodes: [{ variant: 'org', label: 'Pico Ventures' }],
  },
  {
    label: 'Investor — in PL network',
    note: 'End node, avatar + name, links to /members.',
    nodes: [{ variant: 'member', label: 'Wei Chen', memberUid: 'wei-chen' }],
  },
  {
    label: 'Investor — not in network',
    note: 'End node, grey person glyph + name, no link.',
    nodes: [{ variant: 'external', label: 'Marcus True' }],
  },
];

// Real logo asset, same one warm-intros-filter-update feeds its Hashed node.
const HASHED_LOGO = '/icons/demoday/landing/logos/Hashed.svg';

// ── Full chain shapes ─────────────────────────────────────────────────────────
const PL_KNOWN: RouteNode = { pl: true, variant: 'member', label: 'Daniel Roth', memberUid: 'daniel-roth' };
const PL_UNKNOWN: RouteNode = { pl: true, plUnknown: true, variant: 'org', label: 'Protocol Labs' };
const CONNECTOR: RouteNode = { variant: 'member', label: 'Alicia Mer', memberUid: 'alicia-mer' };
const ORG_MED: RouteNode = { variant: 'org', label: 'Hashed', teamUid: 'hashed', logo: HASHED_LOGO };
const INVESTOR: RouteNode = { variant: 'member', label: 'Wei Chen', memberUid: 'wei-chen' };

const CHAIN_SHAPES: { label: string; nodes: RouteNode[] }[] = [
  { label: 'Direct — PL → investor', nodes: [PL_KNOWN, INVESTOR] },
  { label: 'Indirect — PL → connector → investor', nodes: [PL_KNOWN, CONNECTOR, INVESTOR] },
  { label: 'Indirect — PL → org (person unknown) → investor', nodes: [PL_UNKNOWN, ORG_MED, INVESTOR] },
];

// ── Full path-card states (driven through the real WarmPathPanel) ─────────────
const baseInvestor = MOCK_MEMBERS[0];
const baseSamplePath = MOCK_MEMBERS.find((m) => m.paths.length > 0)!.paths[0];

let _pid = 70000;
function makePath(route: PathRoute, explanation: string, rank = 1): MockPath {
  return { ...baseSamplePath, id: _pid++, rank, proximity_code: 'F+1A', score: 0.86, route, explanation };
}

function makeInvestor(path: MockPath | null, inNetwork = true): MockInvestor {
  return {
    ...baseInvestor,
    first_name: 'Wei',
    last_name: 'Chen',
    lab_os_profile: inNetwork ? { type: 'member', uid: 'wei-chen', slug: 'wei-chen', name: 'Wei Chen' } : null,
    has_path: !!path,
    best_proximity_code: path ? 'F+1A' : null,
    paths: path ? [path] : [],
  };
}

const PATH_STATES: { label: string; note: string; investor: MockInvestor }[] = [
  {
    label: 'Direct — PL teammate known',
    note: 'Tie stat under the chain; no Contact details (the PL teammate is reached internally).',
    investor: makeInvestor(
      makePath(
        {
          pl: {
            known: true,
            name: 'Daniel Roth',
            role: 'Partnerships · Protocol Labs',
            email: 'daniel@protocol.ai',
            linkedin: 'daniel-roth',
            tie: 0.62,
            lastContact: '~3 weeks ago',
          },
        },
        'Daniel at PL is in direct contact with the investor — ask him to make the intro.',
      ),
    ),
  },
  {
    label: 'Direct — PL person unknown',
    note: '“Protocol Labs” node, no mediator, no Contact details.',
    investor: makeInvestor(
      makePath({ pl: { known: false } }, 'PL can reach this investor directly — we haven’t identified which teammate yet.'),
    ),
  },
  {
    label: 'Indirect — connector in network',
    note: 'Contact details card (white), full email + channels, blue name + arrow (in LabOS), multiple teams (+N more).',
    investor: makeInvestor(
      makePath(
        {
          pl: { known: true, name: 'Markus', role: 'Investments · Protocol Labs', email: 'markus@protocol.ai', tie: 0.4, lastContact: '~8 months ago' },
          mediator: {
            known: true,
            name: 'Alicia Mer',
            role: 'CEO & Co-founder',
            email: 'alicia@modularglobe.xyz',
            linkedin: 'alicia-mer',
            telegram: 'aliciamer',
            memberUid: 'alicia-mer',
            teams: [
              { name: 'Modular Globe', teamUid: 'modular-globe' },
              { name: 'BioDAO', teamUid: 'biodao' },
              { name: 'Longevity Fund' },
            ],
          },
        },
        'Reach Alicia via Markus — she can route the intro.',
      ),
    ),
  },
  {
    label: 'Indirect — connector not in network',
    note: 'Contact details card, but the connector is external (default-colour name, no arrow/link).',
    investor: makeInvestor(
      makePath(
        {
          pl: { known: false },
          mediator: {
            known: true,
            name: 'James Whitfield',
            role: 'Partner · Electric Capital',
            email: 'james@electriccapital.com',
            teams: [{ name: 'Electric Capital', teamUid: 'electric-capital' }],
          },
        },
        'James at Electric Capital co-invested alongside the investor — reach out directly.',
      ),
    ),
  },
  {
    label: 'Indirect — team known, person unknown',
    note: '“Organization details” card — Connection unknown, with the route-the-intro guidance.',
    investor: makeInvestor(
      makePath(
        {
          pl: { known: true, name: 'Rina', role: 'Partnerships · Protocol Labs', email: 'rina@protocol.ai', tie: 0.55, lastContact: '~2 months ago' },
          // No teamUid → external org, so the node gets the dashed stroke (matches
          // the prototype's org-unknown nodes).
          mediator: { known: false, team: { name: 'Hashed' } },
        },
        'We don’t know who at Hashed can connect yet — they can route the intro, so reach out to the team and ask.',
      ),
    ),
  },
  {
    label: 'Cold — no warm path',
    note: 'No connectors at all — would be cold outreach.',
    investor: makeInvestor(null),
  },
];

export default function WarmPathStatesPrototype() {
  // Client-only: the contact channels reuse ProfileSocialLink (styled-jsx), which
  // can mismatch on SSR. Gate the body until mounted.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return <div className={g.page} />;

  return (
    <div className={g.page}>
      <header className={g.head}>
        <h1 className={g.title}>Warm path — states reference</h1>
        <p className={g.subtitle}>
          Every node state and warm-path card state, rendered through the real components. For dev reference only — not a
          flow.
        </p>
      </header>

      <section className={g.section}>
        <h2 className={g.sectionTitle}>Node states</h2>
        <div className={g.grid}>
          {NODE_STATES.map((state) => (
            <div key={state.label} className={g.case}>
              <div className={g.caseLabel}>{state.label}</div>
              <PeopleChain nodes={state.nodes} className={`${x.drawerChain} ${x.chainBig}`} />
              <div className={g.caseNote}>{state.note}</div>
            </div>
          ))}
        </div>
      </section>

      <section className={g.section}>
        <h2 className={g.sectionTitle}>Chain shapes</h2>
        <div className={g.grid}>
          {CHAIN_SHAPES.map((shape) => (
            <div key={shape.label} className={g.case}>
              <div className={g.caseLabel}>{shape.label}</div>
              <PeopleChain nodes={shape.nodes} className={`${x.drawerChain} ${x.chainBig}`} />
            </div>
          ))}
        </div>
      </section>

      <section className={g.section}>
        <h2 className={g.sectionTitle}>Warm path card states</h2>
        <div className={g.stack}>
          {PATH_STATES.map((state) => (
            <div key={state.label} className={g.case}>
              <div className={g.caseLabel}>{state.label}</div>
              <div className={g.caseNote}>{state.note}</div>
              <div className={g.cardWrap}>
                <WarmPathPanel paths={state.investor.paths} investor={state.investor} />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
