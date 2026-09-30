'use client';

import React, { useEffect, useMemo, useState } from 'react';
import clsx from 'clsx';
import { useMeasure } from 'react-use';
import { ISLANDS, MAP_STATES, PORTFOLIO, type IslandId, type PortfolioLogo } from '../data/islands';
import { TEAM_INFO } from '../data/teamInfo';
import { directoryUrl, displayNameOf } from '../data/directoryUrl';
import s from './PortfolioPanel.module.scss';

/**
 * Marketing's logo islands (logo-islands.vercel.app), rebuilt as one SVG.
 * Every tile position is the site's own: MAP_STATES holds where it draws each
 * logo for every year and for each category.
 * - Hover: the other islands dim, the hovered island glows, the tile darkens.
 * - Click: the map dims and the name card opens (one-liner, stage, since-year,
 *   website and the directory profile are ours: the site's card stops at the name).
 * - Footer: the category row and the 2014–2026 year strip.
 * - Under 768px: the site's phone layout, islands as rows of tiles.
 */

const SIZE = 8; // the site's hex radius, in SVG units
const SQRT3 = Math.sqrt(3);
const TILE = SIZE - 0.4; // drawn a hair small so the black shows between tiles
const LOGO = 9.2;
const FIRST_YEAR = 2014;
const CURRENT_YEAR = 2026;
const YEARS = Array.from({ length: CURRENT_YEAR - FIRST_YEAR + 1 }, (_, i) => FIRST_YEAR + i);
const PHONE_MAX_WIDTH = 768;

type Tile = { x: number; y: number; logo: PortfolioLogo; island: IslandId; color: string };

const axialToXY = (q: number, r: number) => ({ x: SIZE * SQRT3 * (q + r / 2), y: 1.5 * SIZE * r });

// Pointy-top hexagon centred on the origin (tiles are moved with a transform).
const hexPoints = (radius: number) =>
  Array.from({ length: 6 }, (_, i) => {
    const a = ((60 * i - 30) * Math.PI) / 180;
    return `${(radius * Math.cos(a)).toFixed(2)},${(radius * Math.sin(a)).toFixed(2)}`;
  }).join(' ');
const HEX = hexPoints(TILE);
const CARD_HEX = hexPoints(8.6);

const islandOf = (id: IslandId) => ISLANDS.find((i) => i.id === id)!;

// "https://www.netholabs.com/" -> "netholabs.com"; null when the value isn't a URL.
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
// size and a filtered view stays centred.
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

type Props = {
  /** Controls drawn inside the black box, above the map (the Map / List switch). */
  header?: React.ReactNode;
  onTileOpened?: (logo: PortfolioLogo) => void;
  onProfileClicked?: (logo: PortfolioLogo) => void;
};

export const IslandsMap = ({ header, onTileOpened, onProfileClicked }: Props) => {
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
  const isPhone = width > 0 && width < PHONE_MAX_WIDTH;

  const view = useMemo(() => {
    const active = activeIn(year);
    if (isPhone) {
      // ~50px tiles: the site's 6 / 5 tiles across a phone.
      const perRow = Math.max(1, Math.floor(width / 50));
      const pool = PORTFOLIO.filter((l) => active(l) && (!focus || l.island === focus));
      const { tiles, width: w, height: h } = phoneTiles(pool, perRow);
      return { tiles, viewBox: `0 0 ${w} ${h}`, showCube: false };
    }
    const viewBox = `${-FRAME.w} ${-FRAME.h} ${FRAME.w * 2} ${FRAME.h * 2}`;
    const tiles = focus ? tilesOf(`${CURRENT_YEAR}:${focus}`, active) : tilesOf(String(year));
    return { tiles, viewBox, showCube: true };
  }, [isPhone, width, year, focus]);

  // Years in which the chosen island's teams joined read a step brighter.
  const brightYears = useMemo(
    () => new Set(focus ? PORTFOLIO.filter((l) => l.island === focus).map((l) => l.startYear) : []),
    [focus],
  );

  const hoveredIsland = selected ? null : (hovered?.island ?? null);
  const stepYear = (d: number) => setYear((y) => Math.min(CURRENT_YEAR, Math.max(FIRST_YEAR, y + d)));
  const open = (logo: PortfolioLogo) => {
    setSelected(logo);
    onTileOpened?.(logo);
  };

  return (
    <div className={s.islandsRoot} ref={ref}>
      {header}
      <div className={s.islandsStage}>
        {focus && (
          <button type="button" className={s.islandsClose} onClick={() => setFocus(null)}>
            Close <span aria-hidden>–</span>
          </button>
        )}

        <svg className={s.islandsSvg} viewBox={view.viewBox} role="group" aria-label="PL Network portfolio map">
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
                    className={s.tile}
                    style={{ transform: `translate(${t.x}px, ${t.y}px)` }}
                    role="button"
                    tabIndex={0}
                    aria-label={displayNameOf(t.logo)}
                    onMouseEnter={() => setHovered(t)}
                    onMouseLeave={() => setHovered(null)}
                    onFocus={() => setHovered(t)}
                    onBlur={() => setHovered(null)}
                    onClick={() => open(t.logo)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        open(t.logo);
                      }
                    }}
                  >
                    <polygon points={HEX} fill={hovered?.logo.id === t.logo.id ? sink(t.color) : t.color} />
                    <image
                      href={t.logo.logo}
                      x={-LOGO / 2}
                      y={-LOGO / 2}
                      width={LOGO}
                      height={LOGO}
                      preserveAspectRatio="xMidYMid meet"
                    />
                  </g>
                ))}
            </g>
          ))}

          {/* The PL cube at 0,0, white on the sea. It belongs to the PL island, so it dims and glows with it. */}
          {view.showCube && (
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
          <div
            // On a phone the map is far taller than the screen: centred in the map,
            // the card would open off-screen from the tile that was tapped.
            className={clsx(s.islandsOverlay, { [s.islandsOverlayFixed]: isPhone })}
            onClick={(e) => e.target === e.currentTarget && setSelected(null)}
          >
            <div className={s.islandsCard} role="dialog" aria-label={displayNameOf(selected)}>
              <svg className={s.cardHex} viewBox="-9 -9 18 18" aria-hidden>
                <polygon points={CARD_HEX} fill={islandOf(selected.island).color} />
                <image href={selected.logo} x={-5.4} y={-5.4} width={10.8} height={10.8} />
              </svg>
              <div className={s.cardBody}>
                <span className={s.cardName}>{displayNameOf(selected)}</span>
                {info?.oneLiner && <p className={s.cardOneLiner}>{info.oneLiner}</p>}
                <ul className={s.cardMeta}>
                  <li className={s.cardMetaItem}>
                    <svg className={s.cardMetaHex} viewBox="-9 -9 18 18" aria-hidden>
                      <polygon points={CARD_HEX} fill={islandOf(selected.island).color} />
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
                <a
                  className={s.cardLink}
                  href={directoryUrl(selected)}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => onProfileClicked?.(selected)}
                >
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
            disabled={year === FIRST_YEAR}
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
