'use client';

import { Button } from '@/components/common/Button/Button';
import { useMcpLimits } from '@/services/mcp/hooks/useMcpLimits';
import type { McpLimitRow, McpLimitTier } from '@/services/mcp/types';

import s from './McpMemberLimits.module.scss';

function when(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

function tierLabel(tier: McpLimitTier): string {
  return tier === 'pl_infra' ? 'PL infra. Limits are 5 times the standard limits.' : 'Standard.';
}

function usedText(row: McpLimitRow): string {
  const used = row.used === null ? 'Usage unavailable' : `${row.used} of ${row.limit}`;
  const window = row.window === 'day' ? 'per day' : 'per hour';
  const unit = row.callType === 'contact_read' ? 'member contact details ' : '';
  return `${used} ${unit}${window}`;
}

/** Settings → MCP connections: each limit, usage, reset time, override and a recent hit (LAB-3151). */
export function McpMemberLimits() {
  const limits = useMcpLimits(true);

  return (
    <section className={s.root} aria-labelledby="mcp-limits-heading">
      <h6 id="mcp-limits-heading" className={s.title}>
        Agent limits
      </h6>
      <p className={s.help}>These limits are shared by all of your agents.</p>
      {limits.isLoading ? (
        <p className={s.meta}>Loading…</p>
      ) : limits.isError || !limits.data ? (
        <div className={s.error} role="alert">
          <p className={s.meta}>Couldn’t load your limits.</p>
          <Button size="s" variant="secondary" style="border" onClick={() => limits.refetch()}>
            Retry
          </Button>
        </div>
      ) : (
        <>
          <p className={s.meta}>Your tier is {tierLabel(limits.data.tier)}</p>
          <ul className={s.list}>
            {limits.data.limits.map((row) => (
              <li key={row.callType} className={s.row}>
                <div className={s.rowMain}>
                  <span className={s.label}>{row.label}</span>
                  <span className={s.used}>{usedText(row)}</span>
                </div>
                <p className={s.meta}>Resets {when(row.resetsAt)}</p>
                {row.override && (
                  <p className={s.meta}>
                    Custom limit
                    {row.override.endsAt ? ` until ${when(row.override.endsAt)}` : ', with no end date'}.
                  </p>
                )}
                {row.hitRecently && <p className={s.hit}>This limit was hit recently.</p>}
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
