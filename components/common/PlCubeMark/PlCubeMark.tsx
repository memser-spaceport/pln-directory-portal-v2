import React from 'react';
import { CUBE_CELLS, CUBE_HEX_RADIUS, FACET_SHADE } from './cube';

// The logo's own box (27.44 × 27 logo units).
const CENTRE = { x: 27.44 / 2, y: 27 / 2 };

const hexPoints = (x: number, y: number, r: number) =>
  Array.from({ length: 6 }, (_, i) => {
    const a = ((60 * i - 30) * Math.PI) / 180;
    return `${(x + r * Math.cos(a)).toFixed(2)},${(y + r * Math.sin(a)).toFixed(2)}`;
  }).join(' ');

// Each facet nudged away from the centre along its own centroid (an exploded
// view): at small sizes the facets' one-cell gaps close up otherwise.
const facetOffsets = (explode: number) =>
  Array.from({ length: 6 }, (_, f) => {
    const cells = CUBE_CELLS.filter((c) => c[2] === f);
    const cx = cells.reduce((a, c) => a + c[0], 0) / cells.length - CENTRE.x;
    const cy = cells.reduce((a, c) => a + c[1], 0) / cells.length - CENTRE.y;
    const len = Math.hypot(cx, cy) || 1;
    return { dx: (cx / len) * explode, dy: (cy / len) * explode };
  });

type Props = {
  className?: string;
  /** How far each facet moves out from the centre, in logo units. */
  explode?: number;
};

/** The PL cube drawn as a hex grid, shaded per face. Decorative. */
export const PlCubeMark = ({ className, explode = 0.6 }: Props) => {
  const offsets = facetOffsets(explode);
  return (
    <svg className={className} viewBox="-2 -2 31.5 31" aria-hidden focusable="false">
      {CUBE_CELLS.map(([x, y, f], i) => (
        <polygon
          key={i}
          points={hexPoints(x + offsets[f].dx, y + offsets[f].dy, CUBE_HEX_RADIUS * 0.8)}
          fill={FACET_SHADE[f]}
        />
      ))}
    </svg>
  );
};
