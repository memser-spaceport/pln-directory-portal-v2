'use client';

import { useEffect, useState } from 'react';

import { Button } from '@/components/common/Button/Button';
import {
  useAiAppTestingUsers,
  useCreateAiAppTestingUsers,
  useRevokeAiAppTestingUser,
} from '@/services/ai-apps/hooks/useAiAppTestingUsers';
import {
  AI_APP_TESTING_USERS_MAX,
  AiAppTestingUserAccess,
  mintAiAppTestingUserAccess,
} from '@/services/ai-apps/testing-users.service';

import { TestingUsersRevealDialog } from './TestingUsersRevealDialog';

import s from './TestingUsersSection.module.scss';

const DEFAULT_COUNT = '5';

interface Props {
  appUid: string;
  /** Fired once per mount; the modal dedupes it per open. */
  onShown: () => void;
  /** The reveal dialog is open: the modal must not close on Escape underneath it. */
  onRevealChange: (open: boolean) => void;
}

/** Parses the create input: a whole number from 1 to the cap, else null. */
export function parseTestingUsersCount(value: string): number | null {
  if (!/^\d+$/.test(value.trim())) return null;
  const count = Number(value.trim());
  return count >= 1 && count <= AI_APP_TESTING_USERS_MAX ? count : null;
}

/**
 * Preview testing users of one app (LAB-2745): create 1 to 100, get their
 * Preview access strings once, revoke one. Rendered only on the Preview tab of
 * Manage access, for the app's creator or a directory admin, and only when the
 * app has a Preview environment. Access strings live in component state while
 * the reveal dialog is open and nowhere else.
 */
export function TestingUsersSection({ appUid, onShown, onRevealChange }: Props) {
  const { testingUsers, error: loadError, isLoading } = useAiAppTestingUsers(appUid);
  const createUsers = useCreateAiAppTestingUsers(appUid);
  const revokeUser = useRevokeAiAppTestingUser(appUid);

  const [count, setCount] = useState(DEFAULT_COUNT);
  const [error, setError] = useState<string | null>(null);
  const [isMinting, setIsMinting] = useState(false);
  const [revokingUid, setRevokingUid] = useState<string | null>(null);
  const [revealed, setRevealed] = useState<AiAppTestingUserAccess[] | null>(null);

  useEffect(() => {
    onShown();
    // Shown-event only, on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const active = (testingUsers ?? []).filter((user) => !user.revokedAt);
  const isBusy = createUsers.isPending || isMinting || revokingUid !== null;

  const handleCreate = async () => {
    const parsed = parseTestingUsersCount(count);
    if (parsed === null) {
      setError(`Enter a whole number from 1 to ${AI_APP_TESTING_USERS_MAX}.`);
      return;
    }
    setError(null);
    const result = await createUsers.mutateAsync(parsed);
    if (result.error) setError(result.error);
  };

  const handleRevoke = async (uid: string) => {
    setError(null);
    setRevokingUid(uid);
    try {
      const result = await revokeUser.mutateAsync(uid);
      if (result.error) setError(result.error);
    } finally {
      setRevokingUid(null);
    }
  };

  const handleMint = async (uids?: string[]) => {
    setError(null);
    setIsMinting(true);
    try {
      const result = await mintAiAppTestingUserAccess(appUid, uids);
      if (result.error || !result.data) {
        setError(result.error ?? 'Something went wrong. Try again.');
        return;
      }
      setRevealed(result.data);
      onRevealChange(true);
    } finally {
      setIsMinting(false);
    }
  };

  const closeReveal = () => {
    setRevealed(null);
    onRevealChange(false);
  };

  const renderList = () => {
    if (isLoading) return <p className={s.muted}>Loading testing users…</p>;
    if (loadError || !testingUsers) return null;
    if (testingUsers.length === 0) {
      return <p className={s.muted}>No testing users yet. Create some to load-test this app&apos;s Preview.</p>;
    }
    return (
      <ul className={s.list} aria-label="Testing users">
        {testingUsers.map((user) => (
          <li key={user.uid} className={s.row}>
            <span className={s.name}>{user.name}</span>
            {user.revokedAt ? (
              <span className={s.revokedTag}>Revoked</span>
            ) : (
              <span className={s.rowActions}>
                <button
                  type="button"
                  className={s.linkBtn}
                  onClick={() => handleMint([user.uid])}
                  disabled={isBusy}
                  aria-label={`Get token for ${user.name}`}
                >
                  Get token
                </button>
                <button
                  type="button"
                  className={s.dangerBtn}
                  onClick={() => handleRevoke(user.uid)}
                  disabled={isBusy}
                  aria-label={`Revoke ${user.name}`}
                >
                  {revokingUid === user.uid ? 'Revoking…' : 'Revoke'}
                </button>
              </span>
            )}
          </li>
        ))}
      </ul>
    );
  };

  return (
    <section className={s.section} aria-labelledby="ai-app-testing-users-title">
      <div className={s.heading}>
        <h3 id="ai-app-testing-users-title" className={s.title}>
          Testing users
        </h3>
        {testingUsers && (
          <span className={s.count}>
            {active.length} {active.length === 1 ? 'testing user' : 'testing users'}
          </span>
        )}
      </div>
      <p className={s.muted}>
        Testing users can open this app&apos;s Preview for load tests. They are not members and can&apos;t open
        Production.
      </p>

      <div className={s.create}>
        <label className={s.countField}>
          <span className={s.countLabel}>How many</span>
          <input
            type="number"
            inputMode="numeric"
            min={1}
            max={AI_APP_TESTING_USERS_MAX}
            step={1}
            className={s.countInput}
            value={count}
            onChange={(event) => setCount(event.target.value)}
            disabled={isBusy}
            aria-label="Number of testing users to create"
          />
        </label>
        <Button style="border" variant="neutral" size="s" onClick={handleCreate} disabled={isBusy}>
          {createUsers.isPending ? 'Creating…' : 'Create testing users'}
        </Button>
        {active.length > 0 && (
          <Button style="border" variant="neutral" size="s" onClick={() => handleMint()} disabled={isBusy}>
            {isMinting ? 'Getting tokens…' : 'Get tokens for all'}
          </Button>
        )}
      </div>

      {(error || loadError) && (
        <p className={s.error} role="alert">
          {error ?? loadError}
        </p>
      )}

      {renderList()}

      {revealed && <TestingUsersRevealDialog items={revealed} onClose={closeReveal} />}
    </section>
  );
}
