'use client';

import { FormEvent, useState } from 'react';

import { Button } from '@/components/common/Button/Button';
import {
  useDeleteMcpLimitOverride,
  useMcpAdminLimits,
  useSaveMcpLimitOverride,
} from '@/services/mcp/hooks/useMcpAdminLimits';
import type { McpCallType } from '@/services/mcp/types';

import s from './McpAdminLimits.module.scss';

const CALL_TYPES: McpCallType[] = ['read', 'contact_read', 'write', 'forum_post'];

function when(value: string | null): string {
  if (!value) return 'no end date';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

function person(name: string | null, email: string | null, uid: string): string {
  return name || email || uid;
}

/** Directory admins set one member's limit and see who was limited (LAB-3150). */
export function McpAdminLimits() {
  const [query, setQuery] = useState('');
  const [submitted, setSubmitted] = useState('');
  const [memberUid, setMemberUid] = useState('');
  const [callType, setCallType] = useState<McpCallType>('write');
  const [limit, setLimit] = useState('30');
  const [endsAt, setEndsAt] = useState('');
  const view = useMcpAdminLimits(true, submitted);
  const save = useSaveMcpLimitOverride();
  const remove = useDeleteMcpLimitOverride();

  const onSearch = (event: FormEvent) => {
    event.preventDefault();
    setSubmitted(query.trim());
  };

  const onSave = (event: FormEvent) => {
    event.preventDefault();
    const parsed = Number(limit);
    if (!memberUid.trim() || !Number.isInteger(parsed) || parsed < 1) return;
    save.mutate({
      memberUid: memberUid.trim(),
      callType,
      limit: parsed,
      endsAt: endsAt ? new Date(endsAt).toISOString() : null,
    });
  };

  const data = view.data;

  return (
    <section className={s.root} aria-labelledby="mcp-admin-limits-heading">
      <h6 id="mcp-admin-limits-heading" className={s.title}>
        Member limits
      </h6>
      <p className={s.help}>Look up a member. Set a custom limit for one call type. Leave the end date empty for no end date.</p>

      <form className={s.form} onSubmit={onSearch}>
        <label className={s.field}>
          Name, email or uid
          <input className={s.input} value={query} onChange={(event) => setQuery(event.target.value)} />
        </label>
        <Button size="s" variant="secondary" style="border" type="submit">
          Look up
        </Button>
      </form>

      {view.isError && (
        <p className={s.error} role="alert">
          Couldn’t load limit admin.
        </p>
      )}

      {data?.members.map((member) => (
        <div key={member.uid} className={s.card}>
          <p className={s.label}>
            {person(member.name, member.email, member.uid)} · {member.tier === 'pl_infra' ? 'PL infra' : 'Standard'}
          </p>
          <ul className={s.list}>
            {member.limits.map((row) => (
              <li key={row.callType}>
                {row.label}: {row.used === null ? 'usage unavailable' : `${row.used} of ${row.limit}`}{' '}
                {row.window === 'day' ? 'per day' : 'per hour'}
                {row.hitRecently ? ' · hit recently' : ''}
                <button
                  type="button"
                  className={s.link}
                  onClick={() => {
                    setMemberUid(member.uid);
                    setCallType(row.callType);
                    setLimit(String(row.limit));
                  }}
                >
                  Edit
                </button>
              </li>
            ))}
          </ul>
        </div>
      ))}

      <form className={s.form} onSubmit={onSave}>
        <label className={s.field}>
          Member uid
          <input className={s.input} value={memberUid} onChange={(event) => setMemberUid(event.target.value)} required />
        </label>
        <label className={s.field}>
          Call type
          <select className={s.input} value={callType} onChange={(event) => setCallType(event.target.value as McpCallType)}>
            {CALL_TYPES.map((type) => (
              <option key={type} value={type}>
                {type.replace('_', ' ')}
              </option>
            ))}
          </select>
        </label>
        <label className={s.field}>
          Limit
          <input className={s.input} value={limit} onChange={(event) => setLimit(event.target.value)} inputMode="numeric" required />
        </label>
        <label className={s.field}>
          End date
          <input className={s.input} type="datetime-local" value={endsAt} onChange={(event) => setEndsAt(event.target.value)} />
        </label>
        <Button size="s" variant="primary" style="fill" type="submit" disabled={save.isPending}>
          Save override
        </Button>
      </form>
      {save.isError && (
        <p className={s.error} role="alert">
          Couldn’t save the override.
        </p>
      )}

      <h6 className={s.title}>Active overrides</h6>
      {!data?.overrides.length && <p className={s.help}>No active overrides.</p>}
      <ul className={s.list}>
        {data?.overrides.map((row) => (
          <li key={`${row.memberUid}-${row.callType}`}>
            {person(row.memberName, row.email, row.memberUid)} · {row.callType.replace('_', ' ')} · {row.limit} · ends{' '}
            {when(row.endsAt)}
            <button
              type="button"
              className={s.link}
              onClick={() => remove.mutate({ memberUid: row.memberUid, callType: row.callType })}
            >
              Remove
            </button>
          </li>
        ))}
      </ul>

      <h6 className={s.title}>Limited recently</h6>
      {!data?.recentHits.length && <p className={s.help}>Nobody was limited in the last 7 days.</p>}
      <ul className={s.list}>
        {data?.recentHits.map((row) => (
          <li key={`${row.memberUid}-${row.callType}-${row.hitAt}`}>
            {person(row.memberName, row.email, row.memberUid)} · {row.callType.replace('_', ' ')} · {when(row.hitAt)} · resets{' '}
            {when(row.resetsAt)}
          </li>
        ))}
      </ul>

      <h6 className={s.title}>Changes</h6>
      <ul className={s.list}>
        {data?.changes.map((row) => (
          <li key={`${row.memberUid}-${row.callType}-${row.createdAt}`}>
            {row.action} {row.callType.replace('_', ' ')} for {row.memberUid}
            {row.limit !== null ? ` to ${row.limit}` : ''} · {row.actorUid ?? 'unknown admin'} · {when(row.createdAt)}
          </li>
        ))}
      </ul>
    </section>
  );
}
