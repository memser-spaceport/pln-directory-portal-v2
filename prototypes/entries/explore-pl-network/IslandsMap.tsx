'use client';

import React, { useEffect, useMemo, useState } from 'react';
import clsx from 'clsx';
import { useMeasure } from 'react-use';
import { ISLANDS, MAP_STATES, PORTFOLIO, type IslandId, type PortfolioLogo } from './islands';
import { CUBE_CELLS, CUBE_HEX_RADIUS } from './cube';
import { TEAM_INFO } from './teamInfo';
import s from './ExplorePlNetwork.module.scss';

/**
 * Marketing's logo islands (logo-islands.vercel.app), rebuilt as one SVG.
 * Every tile position is the site's own: MAP_STATES holds where it draws each
 * logo for every year and for each category, read from its React state. What
 * is reproduced from watching it:
 * - Hover: the other islands dim to half, the hovered island glows, and the
 *   hovered tile sinks to a darker shade.
 * - Click: the map dims and the white name card opens (View profile is ours).
 * - Footer: the category row ("Name +"; the chosen one a filled pill with ×)
 *   and the 2014–2026 year strip with arrows. A category shows only its
 *   logos, clustered round the PL cube, with Close – to go back.
 * - Tiles glide between states.
 * - Under 768px: the site's phone layout, islands as rows of 6 / 5 tiles.
 * Not captured: category views for years before 2026, which reuse the 2026
 * cluster minus the logos that weren't active yet.
 *
 * `shape="cube"` is ours, not the site's: the same tiles fill the PL cube mark
 * (cube.ts), shaded by face like the isometric logo. See CUBE below.
 */

const SIZE = 8; // the site's hex radius, in SVG units
const SQRT3 = Math.sqrt(3);
const TILE = SIZE - 0.4; // drawn a hair small so the black shows between tiles
const CUBE_TILE = SIZE - 0.2; // the cube packs tighter: half the islands' gap
const LOGO = 9.2;
const YEARS = Array.from({ length: 13 }, (_, i) => 2014 + i);
const CURRENT_YEAR = 2026;

type Tile = { x: number; y: number; logo: PortfolioLogo; island: IslandId; color: string; faded?: boolean };

const axialToXY = (q: number, r: number) => ({ x: SIZE * SQRT3 * (q + r / 2), y: 1.5 * SIZE * r });

// Pointy-top hexagon centred on the origin (tiles are moved with a transform).
const hexPoints = (radius: number) =>
  Array.from({ length: 6 }, (_, i) => {
    const a = ((60 * i - 30) * Math.PI) / 180;
    return `${(radius * Math.cos(a)).toFixed(2)},${(radius * Math.sin(a)).toFixed(2)}`;
  }).join(' ');
const HEX = hexPoints(TILE);
const CUBE_HEX = hexPoints(CUBE_TILE);

const islandOf = (id: IslandId) => ISLANDS.find((i) => i.id === id)!;

// "https://www.netholabs.com/" -> "netholabs.com"; null when the directory's value isn't a URL.
const domainOf = (url: string) => {
  try {
    return new URL(/^https?:\/\//.test(url) ? url : `https://${url}`).hostname.replace(/^www\./, '');
  } catch {
    return null;
  }
};

// The hovered tile sinks toward black, as on the site.
const sink = (hex: string, k = 0.5) => {
  const n = parseInt(hex.slice(1), 16);
  const c = (v: number) =>
    Math.round(v * k)
      .toString(16)
      .padStart(2, '0');
  return `#${c(n >> 16)}${c((n >> 8) & 255)}${c(n & 255)}`;
};
const activeIn = (year: number) => (l: PortfolioLogo) =>
  l.startYear <= year && (l.endYear === null || year <= l.endYear);

const tilesOf = (key: string, keep?: (l: PortfolioLogo) => boolean): Tile[] => {
  const flat = MAP_STATES[key] ?? [];
  const tiles: Tile[] = [];
  for (let i = 0; i < flat.length; i += 3) {
    const logo = PORTFOLIO[flat[i]];
    if (!logo || (keep && !keep(logo))) continue;
    tiles.push({
      ...axialToXY(flat[i + 1], flat[i + 2]),
      logo,
      island: logo.island,
      color: islandOf(logo.island).color,
    });
  }
  return tiles;
};

// One frame for every state, symmetric round the cube, so tiles keep their
// size and a filtered view stays centred — as on the site.
const FRAME = (() => {
  let w = 0;
  let h = 0;
  for (const flat of Object.values(MAP_STATES)) {
    for (let i = 0; i < flat.length; i += 3) {
      const { x, y } = axialToXY(flat[i + 1], flat[i + 2]);
      w = Math.max(w, Math.abs(x));
      h = Math.max(h, Math.abs(y));
    }
  }
  return { w: w + SIZE * 1.1, h: h + SIZE * 1.1 };
})();

// The site's phone layout: islands in order, rows of `perRow` then
// `perRow - 1`, a blank row between islands.
const phoneTiles = (logos: PortfolioLogo[], perRow: number) => {
  const w = SIZE * SQRT3;
  const tiles: Tile[] = [];
  let row = 0;
  for (const island of ISLANDS) {
    const own = logos.filter((l) => l.island === island.id);
    if (!own.length) continue;
    let k = 0;
    while (k < own.length) {
      const inRow = row % 2 === 0 ? perRow : Math.max(1, perRow - 1);
      for (let col = 0; col < inRow && k < own.length; col++) {
        const logo = own[k++];
        tiles.push({
          x: w * (col + (row % 2 ? 1 : 0.5)),
          y: SIZE + row * 1.5 * SIZE,
          logo,
          island: island.id,
          color: island.color,
        });
      }
      row++;
    }
    row++;
  }
  return { tiles, width: w * perRow, height: Math.max(1, row - 1) * 1.5 * SIZE + SIZE };
};

// ---- The PL cube ---------------------------------------------------------------
// Every team active today gets a fixed cell in the cube so the mark never
// breaks up: an earlier year leaves a newer team's cell as a faint empty tile,
// and a category dims the rest in place instead of re-laying the map.
// - Colour is by face, as the isometric mark reads: top faces light, left face
//   bright, right face deep, the two inner pieces halfway between the two.
// - Categories fill the cube as contiguous regions: PL's own teams in the
//   top-right lozenge, then Neurotech, Economies & Governance and AI & Robotics
//   through the small pieces and the top bar, Digital Human Rights across the
//   two big faces. Within a category the order is shuffled (seeded), because
//   logo ids are time-ordered and would band the cube by year.
// - The 3 teams that have ended (endYear set) aren't in the cube.
export const FACET_SHADE = ['#2E5AA8', '#2E5AA8', '#81A5E1', '#4584EF', '#244680', '#81A5E1'];
const FACET_ORDER = [5, 1, 0, 2, 4, 3];
const CUBE_ISLAND_ORDER: IslandId[] = [
  'pl-infra',
  'neurotech',
  'economies--governance',
  'ai--robotics',
  'digital-human-rights',
];
const CUBE_SCALE = SIZE / CUBE_HEX_RADIUS;
const CUBE_CENTRE = { x: 27.44 / 2, y: 27 / 2 };

const CUBE = (() => {
  const cells = FACET_ORDER.flatMap((f) =>
    CUBE_CELLS.filter((c) => c[2] === f).sort((a, b) => a[1] - b[1] || a[0] - b[0]),
  ).map(([x, y, f]) => ({
    x: (x - CUBE_CENTRE.x) * CUBE_SCALE,
    y: (y - CUBE_CENTRE.y) * CUBE_SCALE,
    color: FACET_SHADE[f],
  }));
  let seed = 5511; // the site's own layout seed, for want of a better one
  const random = () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let v = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    v = (v + Math.imul(v ^ (v >>> 7), 61 | v)) ^ v;
    return ((v ^ (v >>> 14)) >>> 0) / 4294967296;
  };
  const shuffled = (list: PortfolioLogo[]) =>
    list
      .map((l) => ({ l, k: random() }))
      .sort((a, b) => a.k - b.k)
      .map(({ l }) => l);
  const logos = CUBE_ISLAND_ORDER.flatMap((id) =>
    shuffled(PORTFOLIO.filter((l) => l.island === id && activeIn(CURRENT_YEAR)(l))),
  );
  return {
    // Cells beyond the teams (none today: the grid has exactly 281) are left out: a hole in
    // the mark reads as a missing tile.
    placed: logos.map((logo, i) => ({ ...cells[i], logo, island: logo.island })),
    spare: [] as typeof cells,
    half: Math.max(...cells.map((c) => Math.max(Math.abs(c.x), Math.abs(c.y)))) + SIZE * 1.3,
  };
})();

type Props = {
  shape?: 'islands' | 'cube';
  onOpenProfile: (logo: PortfolioLogo) => string;
  // Controls drawn inside the black box, above the map (the Editorial
  // portfolio's Islands / List switch).
  header?: React.ReactNode;
};

export const IslandsMap = ({ shape = 'islands', onOpenProfile, header }: Props) => {
  const [ref, { width }] = useMeasure<HTMLDivElement>();
  const [focus, setFocus] = useState<IslandId | null>(null);
  const [year, setYear] = useState(CURRENT_YEAR);
  const [hovered, setHovered] = useState<Tile | null>(null);
  const [selected, setSelected] = useState<PortfolioLogo | null>(null);

  useEffect(() => {
    if (!selected) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setSelected(null);
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [selected]);

  const info = selected ? TEAM_INFO[selected.id] : undefined;
  const isPhone = width > 0 && width < 768;

  const view = useMemo(() => {
    const active = activeIn(year);
    if (isPhone) {
      // The site fits 6 / 5 tiles across a phone; ~50px tiles do the same here.
      const perRow = Math.max(1, Math.floor(width / 50));
      const pool = PORTFOLIO.filter((l) => active(l) && (!focus || l.island === focus));
      const { tiles, width: w, height: h } = phoneTiles(pool, perRow);
      return { tiles, viewBox: `0 0 ${w} ${h}`, cube: false, isCube: false, spare: [] as typeof CUBE.spare };
    }
    if (shape === 'cube') {
      const tiles: Tile[] = CUBE.placed.map((t) => ({ ...t, faded: !active(t.logo) }));
      const vb = `${-CUBE.half} ${-CUBE.half} ${CUBE.half * 2} ${CUBE.half * 2}`;
      return { tiles, viewBox: vb, cube: false, isCube: true, spare: CUBE.spare };
    }
    const viewBox = `${-FRAME.w} ${-FRAME.h} ${FRAME.w * 2} ${FRAME.h * 2}`;
    const tiles = focus ? tilesOf(`${CURRENT_YEAR}:${focus}`, active) : tilesOf(String(year));
    return { tiles, viewBox, cube: true, isCube: false, spare: [] as typeof CUBE.spare };
  }, [isPhone, width, year, focus, shape]);

  // Years in which the chosen island's teams joined read a step brighter.
  const brightYears = useMemo(
    () => new Set(focus ? PORTFOLIO.filter((l) => l.island === focus).map((l) => l.startYear) : []),
    [focus],
  );

  // In the cube a category stays in place and the rest dims, like a hover.
  const hoveredIsland = selected ? null : (hovered?.island ?? (view.isCube ? focus : null));
  const stepYear = (d: number) => setYear((y) => Math.min(CURRENT_YEAR, Math.max(YEARS[0], y + d)));

  return (
    <div className={s.islandsRoot} ref={ref}>
      {header}
      <div className={s.islandsStage}>
        {focus && !view.isCube && (
          <button type="button" className={s.islandsClose} onClick={() => setFocus(null)}>
            Close <span aria-hidden>–</span>
          </button>
        )}

        <svg
          className={clsx(s.islandsSvg, { [s.cubeSvg]: view.isCube })}
          viewBox={view.viewBox}
          role="group"
          aria-label="PL Network portfolio"
        >
          {/* Spare cube cells, if a grid ever has more cells than teams, stay as
              faint tiles so the mark keeps its outline. */}
          {view.spare.map((c, i) => (
            <polygon
              key={`spare-${i}`}
              points={CUBE_HEX}
              fill={c.color}
              className={s.tileFaded}
              style={{ transform: `translate(${c.x}px, ${c.y}px)` }}
            />
          ))}

          {ISLANDS.map((island) => (
            <g
              key={island.id}
              className={clsx(s.islandGroup, {
                [s.islandDim]: hoveredIsland && hoveredIsland !== island.id,
                [s.islandLit]: hoveredIsland === island.id,
              })}
            >
              {view.tiles
                .filter((t) => t.island === island.id)
                .map((t) => (
                  <g
                    key={t.logo.id}
                    className={clsx(s.tile, { [s.tileFaded]: t.faded })}
                    style={{ transform: `translate(${t.x}px, ${t.y}px)` }}
                    role="button"
                    tabIndex={0}
                    aria-label={t.logo.name}
                    onMouseEnter={() => setHovered(t)}
                    onMouseLeave={() => setHovered(null)}
                    onFocus={() => setHovered(t)}
                    onBlur={() => setHovered(null)}
                    onClick={() => setSelected(t.logo)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setSelected(t.logo);
                      }
                    }}
                  >
                    <polygon
                      points={view.isCube ? CUBE_HEX : HEX}
                      fill={hovered?.logo.id === t.logo.id ? sink(t.color) : t.color}
                    />
                    {!t.faded && (
                      <image
                        href={t.logo.logo}
                        x={-LOGO / 2}
                        y={-LOGO / 2}
                        width={LOGO}
                        height={LOGO}
                        preserveAspectRatio="xMidYMid meet"
                      />
                    )}
                  </g>
                ))}
            </g>
          ))}

          {/* The PL cube at 0,0 — the site's header mark, white on the sea.
              It belongs to the PL island, so it dims and glows with it. */}
          {view.cube && (
            <g
              className={clsx(s.islandGroup, {
                [s.islandDim]: hoveredIsland && hoveredIsland !== 'pl-infra',
                [s.islandLit]: hoveredIsland === 'pl-infra',
              })}
            >
              <path d={PL_CUBE} fill="currentColor" transform="translate(-7.27 -7.16) scale(0.53)" aria-hidden />
            </g>
          )}
        </svg>

        {selected && (
          <div className={s.islandsOverlay} onClick={(e) => e.target === e.currentTarget && setSelected(null)}>
            <div className={s.islandsCard} role="dialog" aria-label={selected.name}>
              <svg className={s.cardHex} viewBox="-9 -9 18 18" aria-hidden>
                <polygon points={hexPoints(8.6)} fill={islandOf(selected.island).color} />
                <image href={selected.logo} x={-5.4} y={-5.4} width={10.8} height={10.8} />
              </svg>
              {/* Ours from here on: the site's card stops at the name. The rest is the team's
                  directory record (teamInfo.ts); an unmatched logo keeps marketing's name and
                  shows only what the islands data knows. */}
              <div className={s.cardBody}>
                <span className={s.cardName}>{info?.displayName ?? selected.name}</span>
                {info?.oneLiner && <p className={s.cardOneLiner}>{info.oneLiner}</p>}
                <ul className={s.cardMeta}>
                  <li className={s.cardMetaItem}>
                    <svg className={s.cardMetaHex} viewBox="-9 -9 18 18" aria-hidden>
                      <polygon points={hexPoints(8.6)} fill={islandOf(selected.island).color} />
                    </svg>
                    {islandOf(selected.island).name}
                  </li>
                  {info?.stage && <li className={s.cardMetaItem}>{info.stage}</li>}
                  <li className={s.cardMetaItem}>In the network since {selected.startYear}</li>
                  {info?.website && domainOf(info.website) && (
                    <li className={s.cardMetaItem}>
                      <a className={s.cardWebsite} href={info.website} target="_blank" rel="noopener noreferrer">
                        {domainOf(info.website)}
                      </a>
                    </li>
                  )}
                </ul>
                <a className={s.cardLink} href={onOpenProfile(selected)} target="_blank" rel="noopener noreferrer">
                  View profile on PL Network ↗
                </a>
              </div>
              <button type="button" className={s.cardClose} onClick={() => setSelected(null)} aria-label="Close">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
                  <path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>

      <div className={s.islandsFooter}>
        <div className={s.categoryRow}>
          {[...ISLANDS.filter((i) => !i.isCentre), ...ISLANDS.filter((i) => i.isCentre)].map((i) => {
            const on = focus === i.id;
            return (
              <button
                key={i.id}
                type="button"
                className={clsx(s.categoryButton, { [s.categoryOn]: on })}
                style={on ? { background: i.color } : undefined}
                aria-pressed={on}
                onClick={() => setFocus(on ? null : i.id)}
              >
                {i.name} <span aria-hidden>{on ? '×' : '+'}</span>
              </button>
            );
          })}
        </div>

        <div className={s.yearRow}>
          <button
            type="button"
            className={s.yearArrow}
            onClick={() => stepYear(-1)}
            aria-label="Previous year"
            disabled={year === YEARS[0]}
          >
            <Arrow dir="left" />
          </button>
          <div className={clsx(s.yearStrip, { [s.yearStripFocused]: !!focus })}>
            {YEARS.map((y) => (
              <button
                key={y}
                type="button"
                className={clsx(s.year, { [s.yearBright]: brightYears.has(y), [s.yearOn]: y === year })}
                aria-pressed={y === year}
                onClick={() => setYear(y)}
              >
                {y}
              </button>
            ))}
          </div>
          <button
            type="button"
            className={s.yearArrow}
            onClick={() => stepYear(1)}
            aria-label="Next year"
            disabled={year === CURRENT_YEAR}
          >
            <Arrow dir="right" />
          </button>
        </div>
      </div>
    </div>
  );
};

const Arrow = ({ dir }: { dir: 'left' | 'right' }) => (
  <svg width="15" height="13" viewBox="0 0 15 13" fill="none" aria-hidden>
    <path
      d={dir === 'left' ? 'M14.5 6.5H1M6.5 1L1 6.5 6.5 12' : 'M0.5 6.5H14M8.5 1L14 6.5 8.5 12'}
      stroke="currentColor"
      strokeWidth="1.1"
    />
  </svg>
);

// The Protocol Labs cube from the site's header logo (27.44 × 27).
const PL_CUBE =
  'M12.6317 19.9304C12.9208 20.0984 13.1555 20.5091 13.1555 20.8436V26.6238C13.1555 26.96 12.9195 27.0955 12.6319 26.9287L7.66188 24.0414C7.37295 23.8732 7.13821 23.4627 7.13821 23.1282V17.348C7.13821 17.0118 7.3743 16.8763 7.66188 17.0431L12.6317 19.9304ZM20.298 14.8313C20.298 15.1674 20.0619 15.5768 19.7741 15.7445L14.8021 18.6329C14.513 18.8011 14.2784 18.663 14.2784 18.3286V12.55C14.2784 12.2138 14.5145 11.8043 14.8021 11.6366L19.7741 8.74819C20.0632 8.58019 20.298 8.71805 20.298 9.05253V14.8313ZM19.2059 7.15925C19.5 7.32997 19.502 7.60552 19.2143 7.77285L14.2396 10.6625C13.9501 10.8306 13.4764 10.8276 13.1836 10.6574L1.08857 3.63064C0.794424 3.45992 0.792405 3.18437 1.08049 3.01721L6.05553 0.127084C6.34496 -0.0409212 6.81865 -0.0380421 7.11145 0.132165L19.2059 7.16027V7.15925ZM6.01531 22.4728C6.01531 22.8098 5.77922 22.9457 5.49231 22.7785L0.522829 19.8914C0.233902 19.7232 0 19.3091 0 18.9692V4.91405C0 4.57245 0.239791 4.43476 0.532084 4.60497L12.624 11.6297C12.9181 11.8002 13.156 12.2131 13.156 12.5476V18.3274C13.156 18.6635 12.9184 18.7982 12.631 18.631L6.54067 15.0934C6.25039 14.9253 6.01565 15.0646 6.01565 15.3983V22.4721L6.01531 22.4728ZM21.4166 8.40354C21.4166 8.06652 21.6527 7.65667 21.9405 7.48951L26.9117 4.60107C27.2007 4.43306 27.4355 4.57533 27.4355 4.91523V18.9704C27.4355 19.312 27.1957 19.7283 26.9032 19.8977L14.8115 26.9222C14.5174 27.0929 14.2794 26.9575 14.2794 26.623V20.8427C14.2794 20.5065 14.5167 20.0958 14.8045 19.929L20.8918 16.3928C21.1812 16.2246 21.4168 15.8119 21.4168 15.4777L21.4166 8.40354ZM15.3601 3.62335C15.0707 3.45535 15.0724 3.18217 15.3601 3.0145L20.3338 0.12556C20.6229 -0.0424455 21.0936 -0.04126 21.3813 0.12556L26.355 3.01535C26.6441 3.18336 26.6427 3.45653 26.355 3.6242L21.3816 6.51382C21.0925 6.68183 20.6219 6.68064 20.3341 6.51382L15.3601 3.62335Z';
