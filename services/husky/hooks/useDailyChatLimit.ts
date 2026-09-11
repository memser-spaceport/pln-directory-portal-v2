'use client';

import { useCallback, useState } from 'react';

import { DAILY_CHAT_LIMIT } from '@/utils/constants';
import { checkRefreshToken, getChatCount, updateChatCount } from '@/utils/husky.utlils';

/** The rungs `HuskyLimitStrip` renders. `warn` is the blocked one. */
export type LimitLevel = 'warn' | 'finalRequest' | 'info' | null;

/**
 * Which rung a given running total lands on.
 *
 * Thresholds are exactly the ones `updateLimitType` used; only *when* they are
 * evaluated changes. Signed-out users are counted in a cookie that expires at
 * midnight, so the count resets itself.
 */
function levelFor(count: number): LimitLevel {
  if (DAILY_CHAT_LIMIT + 1 <= count) return 'warn';
  if (DAILY_CHAT_LIMIT === count) return 'finalRequest';
  if (DAILY_CHAT_LIMIT - count < 4) return 'info';
  return null;
}

/**
 * The signed-out daily quota, split from the chat engine on purpose.
 *
 * Counting and gating used to live in the same function, which is what made the
 * original bug expressible: `updateChatCount()` ran, *then* the `'warn'` branch
 * returned early — after the input had already been cleared and before the turn
 * was added. The user's question was destroyed and one of their ten was spent
 * on it. Here `consume()` looks at the total the submission *would* produce and
 * refuses without spending anything.
 */
export function useDailyChatLimit() {
  const [level, setLevel] = useState<LimitLevel>(null);

  /** Re-read the cookie — it expires at midnight, so a session that outlives
   *  the day must not keep showing yesterday's exhausted state. */
  const refresh = useCallback(() => {
    if (checkRefreshToken()) {
      setLevel(null);
      return;
    }
    setLevel(levelFor(getChatCount()));
  }, []);

  /**
   * Spend one question. Returns false when the quota refuses it, in which case
   * nothing was counted and the caller must leave the question where it is.
   */
  const consume = useCallback((): boolean => {
    // Signed-in users are unlimited; the cookie is not theirs to spend.
    if (checkRefreshToken()) {
      setLevel(null);
      return true;
    }

    const next = levelFor(getChatCount() + 1);
    if (next === 'warn') {
      setLevel('warn');
      return false;
    }

    updateChatCount();
    setLevel(next);
    return true;
  }, []);

  return {
    /** Non-null while the strip should be on screen. */
    level,
    remaining: Math.max(0, DAILY_CHAT_LIMIT - getChatCount()),
    consume,
    refresh,
  };
}
