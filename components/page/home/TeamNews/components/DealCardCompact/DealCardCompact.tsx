'use client';

import clsx from 'clsx';

import { formatTimeAgo } from '@/utils/formatTimeAgo';
import { Badge } from '@/components/common/Badge';
import { DEAL_AUDIENCE_LABELS, DEAL_CATEGORY_LABELS } from '@/services/deals/constants';
import type { TeamNewsAnalyticsSource } from '@/analytics/team-news.analytics';
import type { IDeal } from '@/types/deals.types';

import newsCardStyles from '../NewsCard/NewsCard.module.scss';
import dealStyles from '@/components/page/deals/DealCard/DealCard.module.scss';
import s from './DealCardCompact.module.scss';

interface DealCardCompactProps {
  deal: IDeal;
  onClick?: (deal: IDeal) => void;
  analyticsSource?: TeamNewsAnalyticsSource;
}

/**
 * A deal as an *announcement*, at feed scale.
 *
 * Anatomy is production `DealCard`'s — avatar / details / title / subtitle /
 * tags, same classes — adapted to the feed on three axes only:
 *   - the vendor name drops from 24px to the feed's 18px headline scale, so it
 *     sits level with news rather than out-shouting it;
 *   - the avatar drops from 64px to 48px, still larger than a news logo so the
 *     card reads as its own kind of object;
 *   - `teamsUsingCount` is not shown — adoption is a browsing signal on /deals,
 *     and in a dated stream it says nothing about why this is here now.
 *
 * The whole card is a link, exactly as `DealCard` is.
 *
 * No eligibility gate line: access is all-or-nothing per member
 * (`useDealsAccess`), and `useFeedDeals` doesn't fetch at all without it — so a
 * card that reaches the feed is one this reader can act on. The prototype's
 * per-deal "Restricted to <audience>" copy has no production data source.
 */
export function DealCardCompact({ deal, onClick, analyticsSource = 'home' }: DealCardCompactProps) {
  return (
    <a
      href={`/deals/${deal.uid}`}
      target="_blank"
      rel="noopener noreferrer"
      className={clsx(newsCardStyles.card, s.card)}
      data-analytics-source={analyticsSource}
      onClick={() => onClick?.(deal)}
    >
      <div className={clsx(dealStyles.content, s.content)}>
        <span className={clsx(dealStyles.avatar, s.avatar)}>
          {deal.logoUrl ? (
            <img className={dealStyles.avatarImg} src={deal.logoUrl} alt="" loading="lazy" />
          ) : (
            <span className={dealStyles.avatarPlaceholder}>{deal.vendorName.charAt(0)}</span>
          )}
        </span>

        <div className={clsx(dealStyles.details, s.details)}>
          <div className={dealStyles.description}>
            <div className={s.titleRow}>
              <h3 className={clsx(dealStyles.title, s.title)}>{deal.vendorName}</h3>
              {/* The kind of object, at the top where the eye lands — a deal in
                  a news column has to announce itself as one. */}
              <Badge className={s.kindBadge} noBorder>
                Deal
              </Badge>
            </div>
            <p className={dealStyles.subtitle}>{deal.shortDescription}</p>
          </div>

          {/* Dev's two chips, same classes: category neutral, audience brand. */}
          <div className={dealStyles.tags}>
            {deal.category && (
              <span className={clsx(dealStyles.tag, dealStyles.tagDefault, s.tag)}>
                {DEAL_CATEGORY_LABELS[deal.category] || deal.category}
              </span>
            )}
            {deal.audience && (
              <span className={clsx(dealStyles.tag, dealStyles.tagBrand, s.tag)}>
                {DEAL_AUDIENCE_LABELS[deal.audience] || deal.audience}
              </span>
            )}
          </div>

          {/* Why it is in a dated stream, and when — the only feed-native line. */}
          <div className={s.foot}>Added {formatTimeAgo(deal.createdAt)}</div>
        </div>
      </div>
    </a>
  );
}
