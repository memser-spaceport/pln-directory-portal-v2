'use client';

import { useEffect, useRef, useState } from 'react';

import KudosCard from './kudos-card';
import GiveCommunityKudosModal from './give-kudos-modal';
import { useKudosFeed, useCommunityPool, useRecipients } from '@/hooks/use-kudos';
import { useKudosAnalytics } from '@/analytics/kudos.analytics';
import { getCurrentRoundNumber } from '@/utils/plaa-round.utils';

interface IKudosBoardComponentProps {
  /** Cache key only; the backend resolves the actual round server-side. */
  roundId?: string;
  currentRoundNumber?: number;
}

export default function KudosBoardComponent({
  roundId: roundIdProp,
  currentRoundNumber = getCurrentRoundNumber(),
}: IKudosBoardComponentProps) {
  const roundId = roundIdProp ?? String(currentRoundNumber);
  const analytics = useKudosAnalytics();
  const [modalOpen, setModalOpen] = useState(false);

  // useKudosAnalytics returns a new object each render, so latch on a ref.
  const pageViewTracked = useRef(false);
  useEffect(() => {
    if (pageViewTracked.current) return;
    pageViewTracked.current = true;
    analytics.onKudosPageViewed();
  }, [analytics]);

  const feed = useKudosFeed({ roundId, limit: 24 });
  const pool = useCommunityPool(roundId);
  const recipients = useRecipients();

  function openModal() {
    setModalOpen(true);
    analytics.onGiveKudosOpened();
  }

  // Treat undefined (still loading) as ineligible to avoid a flash before we know either way.
  const eligible = pool.data?.eligible ?? false;
  const poolRemaining = pool.data?.pointsRemaining ?? 0;
  const poolTotal = pool.data?.totalBudget ?? 0;
  const poolUsed = pool.data?.pointsUsed ?? 0;
  const poolPct = poolTotal > 0 ? Math.max(0, Math.min(100, (poolRemaining / poolTotal) * 100)) : 0;
  const canGive = eligible && poolRemaining >= (pool.data?.pointsMin ?? 0);

  return (
    <div className="kudos-board">
      {/* No local <ToastContainer> — the app already mounts one globally; a second one double-renders every toast. */}
      <div className="kudos-board__container">
        <header className="kudos-board__header">
          <div>
            <h1 className="kudos-board__title">Community Kudos 🏆</h1>
            <p className="kudos-board__subtitle">
              Recognize a peer&rsquo;s contribution this round. Spend points from your community pool — every kudos is
              awarded immediately and shows up on the shared board below.
            </p>
          </div>
        </header>

        {eligible && (
          <section className="pool" aria-live="polite">
            <div className="pool__icon" aria-hidden>
              🪙
            </div>
            <div className="pool__body">
              <p className="pool__headline">
                You have <span className="pool__remaining">{poolRemaining}</span> of {poolTotal} community points to
                give this round.
              </p>
              <p className="pool__sub">
                You&rsquo;ve given {poolUsed} of {poolTotal} points so far. Distribute in {pool.data!.pointsStep}
                -point increments ({pool.data!.pointsMin} pts minimum, {pool.data!.pointsMax} pts maximum per
                gift).
              </p>
              <div className="pool__progress" aria-hidden>
                <div className="pool__progress-bar" style={{ width: `${poolPct}%` }} />
              </div>
            </div>
            <button
              type="button"
              className="btn-primary"
              onClick={openModal}
              disabled={!canGive}
              title={canGive ? undefined : 'No community points left to give this round'}
            >
              ＋ Give Community Kudos
            </button>
          </section>
        )}

        <div className="round-note">
          <span className="round-note__icon" aria-hidden>
            ⓘ
          </span>
          <span>
            Kudos stay on the board across rounds — <strong>the board doesn&rsquo;t reset</strong>. Only your community
            points pool resets at the start of each new round (currently Round {currentRoundNumber}).
          </span>
        </div>

        <div className="feed-heading">Shared Board</div>
        {feed.isLoading ? (
          <FeedSkeleton />
        ) : feed.isError ? (
          <FeedError onRetry={() => feed.refetch()} />
        ) : (feed.data?.items ?? []).length === 0 ? (
          <EmptyState onGiveKudos={openModal} disabled={!canGive} showButton={eligible} />
        ) : (
          <div className="feed-grid">
            {feed.data!.items.map((k) => (
              <KudosCard
                key={k.id}
                kudos={k}
                recipients={recipients.data?.items ?? []}
                recipientsLoading={recipients.isLoading}
                poolRemaining={poolRemaining}
                limits={pool.data}
                currentRoundId={pool.data?.roundId}
              />
            ))}
          </div>
        )}
      </div>

      {pool.data && (
        <GiveCommunityKudosModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          recipients={recipients.data?.items ?? []}
          recipientsLoading={recipients.isLoading}
          poolRemaining={poolRemaining}
          limits={pool.data}
        />
      )}

      <style jsx>{`
        /* Inset and max-width come from .plaa__content — don't clamp twice. */
        .kudos-board__container {
          padding: 12px 0 48px;
        }
        .kudos-board__header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          margin-bottom: 20px;
          flex-wrap: wrap;
          gap: 12px;
        }
        .kudos-board__title {
          font-size: 32px;
          font-weight: 600;
          letter-spacing: -0.022em;
          line-height: 1.2;
          color: #0f172a;
        }
        .kudos-board__subtitle {
          font-size: 16px;
          color: #64748b;
          margin-top: 6px;
          line-height: 1.5;
          max-width: 640px;
        }

        .btn-primary {
          background: #1b54ff;
          color: white;
          border: none;
          padding: 9px 20px;
          border-radius: 6px;
          font-family: inherit;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 7px;
          letter-spacing: -0.01em;
          box-shadow:
            0 1px 2px rgba(15, 23, 42, 0.06),
            0 1px 3px rgba(15, 23, 42, 0.1);
          transition:
            background 0.15s,
            box-shadow 0.15s;
        }
        .btn-primary:not(:disabled):hover {
          background: #1645d3;
        }
        .btn-primary:focus-visible {
          outline: none;
          box-shadow: 0 0 0 3px rgba(27, 84, 255, 0.35);
        }
        .btn-primary:disabled {
          background: #cbd5e1;
          color: #f8fafc;
          cursor: not-allowed;
          box-shadow: none;
        }
        .pool {
          background: linear-gradient(135deg, #dfe6fb, #f4f8ff);
          border: 1px solid #87a6fd;
          border-radius: 10px;
          padding: 16px 20px;
          margin-bottom: 16px;
          display: flex;
          align-items: center;
          gap: 18px;
          flex-wrap: wrap;
        }
        .pool__icon {
          width: 44px;
          height: 44px;
          flex-shrink: 0;
          background: white;
          border-radius: 50%;
          border: 1px solid #87a6fd;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #1b54ff;
          font-size: 22px;
        }
        .pool__body {
          flex: 1;
          min-width: 0;
        }
        .pool__headline {
          font-size: 14px;
          font-weight: 600;
          color: #1036a8;
          letter-spacing: -0.005em;
        }
        .pool__remaining {
          font-size: 18px;
          font-variant-numeric: tabular-nums;
        }
        .pool__sub {
          font-size: 12.5px;
          color: #64748b;
          margin-top: 3px;
          line-height: 1.5;
        }
        .pool__progress {
          width: 100%;
          max-width: 280px;
          height: 8px;
          background: white;
          border: 1px solid #87a6fd;
          border-radius: 999px;
          margin-top: 8px;
          overflow: hidden;
        }
        .pool__progress-bar {
          height: 100%;
          background: #1b54ff;
          border-radius: 999px;
          transition: width 0.3s;
        }

        .round-note {
          display: flex;
          align-items: center;
          gap: 8px;
          background: #fbfcfe;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 10px 14px;
          margin-bottom: 24px;
          font-size: 12.5px;
          color: #64748b;
        }
        .round-note__icon {
          color: #1b54ff;
          font-size: 14px;
          line-height: 1;
          flex-shrink: 0;
        }
        .round-note :global(strong) {
          color: #334155;
        }

        .feed-heading {
          font-size: 13px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: #64748b;
          margin-bottom: 14px;
        }
        .feed-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
          gap: 16px;
        }
        @media (max-width: 900px) {
          .kudos-board__container {
            padding: 8px 0 32px;
          }
          .pool {
            flex-direction: column;
            align-items: stretch;
          }
        }
      `}</style>
    </div>
  );
}

function FeedSkeleton() {
  return (
    <div className="grid">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="sk" />
      ))}
      <style jsx>{`
        .grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
          gap: 16px;
        }
        .sk {
          height: 190px;
          background: #f1f5f9;
          border-radius: 8px;
          animation: pulse 1.4s ease-in-out infinite;
        }
        @keyframes pulse {
          0%,
          100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
      `}</style>
    </div>
  );
}

function FeedError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="es">
      <div className="es__title">Couldn&rsquo;t load the board.</div>
      <button type="button" className="es__btn" onClick={onRetry}>
        Retry
      </button>
      <style jsx>{`
        .es {
          text-align: center;
          padding: 60px 20px;
          color: #64748b;
        }
        .es__title {
          font-size: 16px;
          font-weight: 600;
          color: #334155;
          margin-bottom: 12px;
        }
        .es__btn {
          background: white;
          color: #1b54ff;
          border: 1.5px solid #1b54ff;
          padding: 8px 18px;
          border-radius: 6px;
          font-weight: 600;
          cursor: pointer;
          font-family: inherit;
        }
      `}</style>
    </div>
  );
}

function EmptyState({
  onGiveKudos,
  disabled = false,
  showButton = true,
}: {
  onGiveKudos: () => void;
  disabled?: boolean;
  showButton?: boolean;
}) {
  return (
    <div className="es">
      <div className="es__icon">🎉</div>
      <div className="es__title">No kudos on the board yet</div>
      <div className="es__sub">Be the first to recognize a contributor!</div>
      {showButton && (
        <button
          type="button"
          className="es__btn"
          onClick={onGiveKudos}
          disabled={disabled}
          title={disabled ? 'No community points left to give this round' : undefined}
        >
          ＋ Give Community Kudos
        </button>
      )}
      <style jsx>{`
        .es {
          text-align: center;
          padding: 60px 20px;
          color: #64748b;
        }
        .es__icon {
          font-size: 40px;
          margin-bottom: 12px;
        }
        .es__title {
          font-size: 16px;
          font-weight: 600;
          color: #334155;
        }
        .es__sub {
          font-size: 13.5px;
          margin-top: 4px;
        }
        .es__btn {
          margin-top: 16px;
          background: #1b54ff;
          color: white;
          border: none;
          padding: 9px 20px;
          border-radius: 6px;
          font-family: inherit;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
        }
        .es__btn:not(:disabled):hover {
          background: #1645d3;
        }
        .es__btn:disabled {
          background: #f1f5f9;
          color: #94a3b8;
          border-color: #cbd5e1;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
}
