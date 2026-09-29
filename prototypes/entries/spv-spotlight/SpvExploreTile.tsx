'use client';

import React from 'react';
import { CUBE_CELLS, CUBE_HEX_RADIUS } from '../explore-pl-network/cube';
import { FACET_SHADE } from '../explore-pl-network/IslandsMap';
import { EXPLORE_PL_NETWORK_URL } from './mocks';
import s from './SpvSpotlight.module.scss';

// The Explore landing's PL cube, drawn small and without logos: the same hex
// cells and face shading, so the tile previews what it opens. At this size the
// landing's tight facet gaps close up, so each facet is nudged a little away
// from the centre (an exploded view) — only the gaps between facets widen.
const CENTRE = { x: 27.44 / 2, y: 27 / 2 };
const EXPLODE = 0.6;
const FACET_OFFSET = Array.from({ length: 6 }, (_, f) => {
  const cells = CUBE_CELLS.filter((c) => c[2] === f);
  const cx = cells.reduce((a, c) => a + c[0], 0) / cells.length - CENTRE.x;
  const cy = cells.reduce((a, c) => a + c[1], 0) / cells.length - CENTRE.y;
  const len = Math.hypot(cx, cy) || 1;
  return { dx: (cx / len) * EXPLODE, dy: (cy / len) * EXPLODE };
});
const hex = (x: number, y: number, r: number) =>
  Array.from({ length: 6 }, (_, i) => {
    const a = ((60 * i - 30) * Math.PI) / 180;
    return `${(x + r * Math.cos(a)).toFixed(2)},${(y + r * Math.sin(a)).toFixed(2)}`;
  }).join(' ');

/**
 * "Explore PL Network" as a tile rather than a hero button (decided
 * 2026-09-29; it is the page's only way to the Explore landing). The tile earns its space by saying what the network is before
 * asking for the click; the whole tile is the link.
 */
// The count is the network figure the Explore landing shows (750+, 2026-09-29
// review), not the 284 logos on its map: the tile names what it opens.
export const SpvExploreTile = () => (
  <a className={s.exploreTile} href={EXPLORE_PL_NETWORK_URL} target="_blank" rel="noopener noreferrer">
    <div className={s.exploreTileText}>
      <span className={s.exploreTileOverline}>New to Protocol Labs?</span>
      <span className={s.exploreTileTitle}>Explore the PL Network</span>
      <span className={s.exploreTileBody}>
        750+ teams across AI, neurotech, digital rights and new economies: the network this SPV comes from, and the
        founders, funds and labs behind it.
      </span>
      <span className={s.exploreTileCta}>
        Explore PL Network <ArrowRight />
      </span>
    </div>
    <svg className={s.exploreTileArt} viewBox="-2 -2 31.5 31" aria-hidden>
      {CUBE_CELLS.map(([x, y, f], i) => (
        <polygon
          key={i}
          points={hex(x + FACET_OFFSET[f].dx, y + FACET_OFFSET[f].dy, CUBE_HEX_RADIUS * 0.8)}
          fill={FACET_SHADE[f]}
        />
      ))}
    </svg>
  </a>
);

const ArrowRight = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
    <path
      d="M3 8h10M9 4l4 4-4 4"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
