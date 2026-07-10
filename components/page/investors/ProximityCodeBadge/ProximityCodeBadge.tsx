import clsx from 'clsx';
import { PATH_CALIBER_LABEL, PATH_CONNECTOR_LABEL } from '@/services/investors/constants';
import type { PathCaliber, PathConnectorType } from '@/services/investors/types';
import s from './ProximityCodeBadge.module.scss';

interface Props {
  /** Proximity code, e.g. "F+2B", "JB+1A", or "C" for cold. */
  code?: string | null;
  /** Explicit cold marker (e.g. has_path === false). Overrides the code. */
  cold?: boolean;
  /** 0–1 path warmth (or legacy caliber confidence); rendered as a % suffix. */
  confidence?: number | null;
  className?: string;
}

type ParsedCode = {
  connector: PathConnectorType;
  caliber: PathCaliber | null;
  isCold: boolean;
};

// Code grammar: {connector}+{hops}{caliber}, e.g. "F+2B" / "JB+1A". Cold = "C".
function parseCode(code: string): ParsedCode {
  if (!code || code === 'C' || code.startsWith('C')) {
    return { connector: 'C', caliber: null, isCold: true };
  }
  const connector = (code.split('+')[0] || 'O') as PathConnectorType;
  const last = code.charAt(code.length - 1);
  const caliber: PathCaliber | null = last === 'A' || last === 'B' ? last : null;
  return { connector, caliber, isCold: false };
}

/**
 * The proximity axis at a glance — how warmly PL can reach this investor.
 * Distinct from `fit_score` (sector/stage fit). Colored by caliber:
 * A = strong, B = partial, cold = no path.
 */
export function ProximityCodeBadge({ code, cold, confidence, className }: Props) {
  const isExplicitCold = cold || !code;
  const parsed = isExplicitCold
    ? { connector: 'C' as PathConnectorType, caliber: null, isCold: true }
    : parseCode(code!);

  if (parsed.isCold) {
    return (
      <span className={clsx(s.badge, s.cold, className)} title="No warm path found — cold outreach">
        Cold
      </span>
    );
  }

  const calClass = parsed.caliber === 'A' ? s.calA : parsed.caliber === 'B' ? s.calB : s.calNone;
  const tooltip = [
    PATH_CONNECTOR_LABEL[parsed.connector],
    parsed.caliber ? PATH_CALIBER_LABEL[parsed.caliber] : null,
    typeof confidence === 'number' ? `Path warmth ${Math.round(confidence * 100)}` : null,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <span className={clsx(s.badge, calClass, className)} title={tooltip}>
      <span className={s.code}>{code}</span>
      {typeof confidence === 'number' && <span className={s.conf}>{Math.round(confidence * 100)}%</span>}
    </span>
  );
}
