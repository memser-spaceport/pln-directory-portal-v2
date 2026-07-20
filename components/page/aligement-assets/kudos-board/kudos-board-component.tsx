'use client';

import { useEffect, useState } from 'react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import KudosCard from './kudos-card';
import GiveCommunityKudosModal from './give-kudos-modal';
import { useKudosFeed, useCommunityPool, useRecipients } from '@/hooks/use-kudos';
import { useKudosAnalytics } from '@/analytics/kudos.analytics';
import { COMMUNITY_TRACK } from './data/kudos-board.data';

/* ==========================================================================
   KudosBoardComponent (Lite)
   Top-level component for /alignment-asset/kudos. Community Kudos only.

   Sections, top to bottom:
     1. Page header (title, subtitle, Give Community Kudos)
     2. Community pool callout
     3. Round-scope note
     4. Shared board (community kudos feed)

   All member data (recipients + feed) comes from authenticated API endpoints
   via the hooks below — nothing is hardcoded in the frontend.
   ========================================================================== */

interface IKudosBoardComponentProps {
  /**
   * Optional explicit round key. The backend resolves the actual funding round
   * server-side (from `Round.isCurrentRound`), so this is only a cache key /
   * enable flag — it defaults to the displayed round number, the same source
   * that feeds PlaaMenu's `currentRound`.
   */
  roundId?: string;
  currentRoundNumber?: number;
}

export default function KudosBoardComponent({
  roundId: roundIdProp,
  currentRoundNumber = 18,
}: IKudosBoardComponentProps) {
  const roundId = roundIdProp ?? String(currentRoundNumber);
  const analytics = useKudosAnalytics();
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => { analytics.onKudosPageViewed(); }, [analytics]);

  const feed = useKudosFeed({ roundId, limit: 24 });
  const pool = useCommunityPool(roundId);
  const recipients = useRecipients();

  function openModal() {
    setModalOpen(true);
    analytics.onGiveKudosOpened();
  }

  const poolRemaining = pool.data?.pointsRemaining ?? 0;
  const poolTotal = pool.data?.totalBudget ?? COMMUNITY_TRACK.perRoundBudget;
  const poolUsed = pool.data?.pointsUsed ?? 0;
  const poolPct = poolTotal > 0 ? Math.max(0, Math.min(100, (poolRemaining / poolTotal) * 100)) : 0;

  return (
    <div className="kudos-board">
      <ToastContainer position="bottom-right" autoClose={4000} hideProgressBar theme="dark" />

      <div className="kudos-board__container">
        {/* HEADER */}
        <header className="kudos-board__header">
          <div>
            <h1 className="kudos-board__title">Community Kudos 🏆</h1>
            <p className="kudos-board__subtitle">
              Recognize a peer&rsquo;s contribution this round. Spend points from your community pool — every kudos is
              awarded immediately and shows up on the shared board below.
            </p>
          </div>
          <button type="button" className="btn-primary" onClick={openModal}>＋ Give Community Kudos</button>
        </header>

        {/* POOL CALLOUT */}
        <section className="pool" aria-live="polite">
          <div className="pool__icon" aria-hidden>🪙</div>
          <div className="pool__body">
            <p className="pool__headline">
              You have <span className="pool__remaining">{poolRemaining}</span> of {poolTotal} community points to give this round.
            </p>
            <p className="pool__sub">
              You&rsquo;ve given {poolUsed} of {poolTotal} points so far. Distribute in {COMMUNITY_TRACK.increment}-point
              increments ({COMMUNITY_TRACK.minGift} pts minimum, {COMMUNITY_TRACK.maxGift} pts maximum per gift).
            </p>
            <div className="pool__progress" aria-hidden>
              <div className="pool__progress-bar" style={{ width: `${poolPct}%` }} />
            </div>
          </div>
          <button type="button" className="btn-outline" onClick={openModal}>Give Community Kudos</button>
        </section>

        {/* ROUND NOTE */}
        <div className="round-note">
          ⓘ Board reflects the <strong>current round only</strong> (Round {currentRoundNumber}).
          Points reset at the start of each new round.
        </div>

        {/* SHARED FEED */}
        <div className="feed-heading">Shared Board · This Round</div>
        {feed.isLoading ? (
          <FeedSkeleton />
        ) : feed.isError ? (
          <FeedError onRetry={() => feed.refetch()} />
        ) : (feed.data?.items ?? []).length === 0 ? (
          <EmptyState />
        ) : (
          <div className="feed-grid">
            {feed.data!.items.map((k) => (<KudosCard key={k.id} kudos={k} />))}
          </div>
        )}
      </div>

      <GiveCommunityKudosModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        recipients={recipients.data?.items ?? []}
        poolRemaining={poolRemaining}
      />

      <style jsx>{`
        .kudos-board__container { padding: 32px 40px 48px; max-width: 1100px; margin: 0 auto; }
        .kudos-board__header {
          display: flex; align-items: flex-start; justify-content: space-between;
          margin-bottom: 20px; flex-wrap: wrap; gap: 12px;
        }
        .kudos-board__title { font-size: 32px; font-weight: 600; letter-spacing: -0.022em; line-height: 1.2; color: #0F172A; }
        .kudos-board__subtitle { font-size: 16px; color: #64748B; margin-top: 6px; line-height: 1.5; max-width: 640px; }

        .btn-primary {
          background: #1B54FF; color: white; border: none;
          padding: 9px 20px; border-radius: 6px;
          font-family: inherit; font-size: 14px; font-weight: 600; cursor: pointer;
          display: inline-flex; align-items: center; gap: 7px;
        }
        .btn-primary:hover { background: #1645D3; }
        .btn-outline {
          background: white; color: #1B54FF; border: 1.5px solid #1B54FF;
          padding: 8px 18px; border-radius: 6px;
          font-family: inherit; font-size: 14px; font-weight: 600; cursor: pointer;
        }
        .btn-outline:hover { background: #DFE6FB; }

        .pool {
          background: linear-gradient(135deg, #DFE6FB, #F4F8FF);
          border: 1px solid #87A6FD; border-radius: 10px;
          padding: 16px 20px; margin-bottom: 16px;
          display: flex; align-items: center; gap: 18px; flex-wrap: wrap;
        }
        .pool__icon {
          width: 44px; height: 44px; flex-shrink: 0;
          background: white; border-radius: 50%; border: 1px solid #87A6FD;
          display: flex; align-items: center; justify-content: center;
          color: #1B54FF; font-size: 22px;
        }
        .pool__body { flex: 1; min-width: 0; }
        .pool__headline { font-size: 14px; font-weight: 600; color: #1036A8; letter-spacing: -0.005em; }
        .pool__remaining { font-size: 18px; font-variant-numeric: tabular-nums; }
        .pool__sub { font-size: 12.5px; color: #64748B; margin-top: 3px; line-height: 1.5; }
        .pool__progress {
          width: 100%; max-width: 280px; height: 8px;
          background: white; border: 1px solid #87A6FD; border-radius: 999px;
          margin-top: 8px; overflow: hidden;
        }
        .pool__progress-bar { height: 100%; background: #1B54FF; border-radius: 999px; transition: width 0.3s; }

        .round-note {
          background: #FBFCFE; border: 1px solid #E2E8F0;
          border-radius: 8px; padding: 10px 14px; margin-bottom: 24px;
          font-size: 12.5px; color: #64748B;
        }
        .round-note :global(strong) { color: #334155; }

        .feed-heading {
          font-size: 13px; font-weight: 700; text-transform: uppercase;
          letter-spacing: 0.06em; color: #64748B; margin-bottom: 14px;
        }
        .feed-grid {
          display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 16px;
        }
        @media (max-width: 900px) {
          .kudos-board__container { padding: 20px; }
          .pool { flex-direction: column; align-items: stretch; }
        }
      `}</style>
    </div>
  );
}

/* --------------------------------------------------------------------------
   States
   -------------------------------------------------------------------------- */

function FeedSkeleton() {
  return (
    <div className="grid">
      {Array.from({ length: 4 }).map((_, i) => (<div key={i} className="sk" />))}
      <style jsx>{`
        .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 16px; }
        .sk { height: 190px; background: #F1F5F9; border-radius: 8px; animation: pulse 1.4s ease-in-out infinite; }
        @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.5; } }
      `}</style>
    </div>
  );
}

function FeedError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="es">
      <div className="es__title">Couldn&rsquo;t load the board.</div>
      <button type="button" className="es__btn" onClick={onRetry}>Retry</button>
      <style jsx>{`
        .es { text-align: center; padding: 60px 20px; color: #64748B; }
        .es__title { font-size: 16px; font-weight: 600; color: #334155; margin-bottom: 12px; }
        .es__btn { background: white; color: #1B54FF; border: 1.5px solid #1B54FF; padding: 8px 18px; border-radius: 6px; font-weight: 600; cursor: pointer; font-family: inherit; }
      `}</style>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="es">
      <div className="es__icon">🎉</div>
      <div className="es__title">No kudos yet this round</div>
      <div className="es__sub">Be the first to recognize a contributor.</div>
      <style jsx>{`
        .es { text-align: center; padding: 60px 20px; color: #64748B; }
        .es__icon { font-size: 40px; margin-bottom: 12px; }
        .es__title { font-size: 16px; font-weight: 600; color: #334155; }
        .es__sub { font-size: 13.5px; margin-top: 4px; }
      `}</style>
    </div>
  );
}
