'use client';

import clsx from 'clsx';

import { formatTimeAgo } from '@/utils/formatTimeAgo';

import { Badge } from '@/components/common/Badge';

// Production news-card shell for the feed ground, so a perk sits in the column as
// a peer of a news card rather than as a foreign object.
import s from '@/components/page/home/TeamNews/components/NewsCard/NewsCard.module.scss';
// Production `DealCard`'s own anatomy — avatar / details / title / subtitle /
// tags — reused 1:1 so this reads as the deals surface, not an approximation of
// it. Only the scale is adapted below; the structure and colours are dev's.
import dealCss from '@/components/page/deals/DealCard/DealCard.module.scss';
import v0 from '../newsfeed-v0/NewsfeedV0.module.scss';
import local from './Newsfeed.module.scss';

import type { PerkSignal } from './mocks';

interface PerkCardProps {
  perk: PerkSignal;
  /**
   * True when this card is only reachable via the Deals pill — i.e. it did not
   * earn a slot in the mixed feed. The card says why, on itself, rather than the
   * rule living in a doc nobody opens.
   */
  offFeed?: boolean;
}

/**
 * A perk as an *announcement*, not a listing.
 *
 * Anatomy is production `DealCard`'s, adapted to the feed on three axes only:
 *   - the vendor name drops from 24px to the feed's 18px headline scale, so it
 *     sits level with news rather than out-shouting it;
 *   - the avatar drops from 64px to 48px, still larger than a news logo so the
 *     card reads as its own kind of object;
 *   - `teamsUsingCount` is not shown — adoption is a browsing signal on /deals,
 *     and in a dated stream it says nothing about why this is here now.
 *
 * The whole card is a link, exactly as `DealCard` is.
 */
export function PerkCard({ perk, offFeed = false }: PerkCardProps) {
  return (
    <a
      href={`/deals/${perk.uid}`}
      target="_blank"
      rel="noopener noreferrer"
      className={clsx(s.card, v0.feedCard, local.perkCard, offFeed && local.perkCardOff)}
    >
      <div className={dealCss.content}>
        <span className={clsx(dealCss.avatar, local.perkAvatar)}>
          {perk.logoUrl ? (
            <img className={dealCss.avatarImg} src={perk.logoUrl} alt="" loading="lazy" />
          ) : (
            <span className={dealCss.avatarPlaceholder}>{perk.vendorName.charAt(0)}</span>
          )}
        </span>

        <div className={clsx(dealCss.details, local.perkDetails)}>
          <div className={dealCss.description}>
            <div className={local.perkTitleRow}>
              <h3 className={clsx(dealCss.title, local.perkTitle)}>{perk.vendorName}</h3>
              {/* The kind of object, at the top where the eye lands — a perk in a
                  news column has to announce itself as one. */}
              <Badge className={clsx(local.kindBadge, local.kindDeal)} noBorder>
                Deal
              </Badge>
            </div>
            <p className={dealCss.subtitle}>{perk.shortDescription}</p>
          </div>

          {/* Dev's two chips, same classes: category neutral, audience brand. */}
          <div className={dealCss.tags}>
            <span className={clsx(dealCss.tag, dealCss.tagDefault, local.perkTag)}>{perk.category}</span>
            <span className={clsx(dealCss.tag, dealCss.tagBrand, local.perkTag)}>{perk.audience}</span>
          </div>

          {/* The gate, said out loud. Production ships a DealsNoAccessModal for
              exactly this case — so a perk in a general feed is shown to people who
              would hit "Access Denied" on it. That cost belongs on the card. */}
          {!perk.eligible && (
            <p className={local.perkGate}>
              Restricted to <strong>{perk.audience}</strong>
              {' — '}you don&apos;t have access to this deal.
            </p>
          )}

          {offFeed && (
            <p className={local.perkVerdict}>
              <strong>No event to report.</strong> {perk.liveFor}, unchanged. A standing offer is a state, not news — it
              belongs in search on /deals, not in a dated stream.
            </p>
          )}

          {/* Why it's in a dated stream, and when — the only feed-native line. */}
          <div className={local.perkFoot}>
            {perk.event}
            {' · '}
            {perk.shape === 'announcement' ? formatTimeAgo(perk.date) : perk.liveFor}
          </div>
        </div>
      </div>
    </a>
  );
}
