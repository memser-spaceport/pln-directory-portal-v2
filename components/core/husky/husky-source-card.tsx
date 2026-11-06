'use client';

import { useHuskyAnalytics } from '@/analytics/husky.analytics';
import { useUnifiedSearchAnalytics, type AiQueryEntryPoint } from '@/analytics/unified-search.analytics';
import { groupSourceItems, sourceItems, type SourceItem } from '@/components/utils/sourceItems';
import type { HuskySourceRef } from '@/services/husky/hooks/useHuskyChat';

interface HuskySourceCardProps {
  sources?: string[];
  sourceRefs?: HuskySourceRef[];
  /** Set where the card shows an AI Search answer; a web source click is then recorded for it. */
  entryPoint?: AiQueryEntryPoint;
}

function HuskySourceCard({ sources, sourceRefs, entryPoint }: HuskySourceCardProps) {
  const { trackHuskySourceLinkClicked } = useHuskyAnalytics();
  const { onAiWebSourceClicked } = useUnifiedSearchAnalytics();
  const items = sourceItems(sources, sourceRefs);
  const onSourceClick = (item: SourceItem) => {
    trackHuskySourceLinkClicked(item.href);
    if (entryPoint && item.kind === 'web') onAiWebSourceClicked(item.href, entryPoint);
  };
  return (
    <>
      <div className="sources">
        <h3 className="sources__title">Sources</h3>
        {groupSourceItems(items).map((group) => (
          <div key={group.kind} role="group" aria-label={group.label ?? undefined} className="sources__group">
            {group.label && (
              <p className="sources__group__label" aria-hidden="true">
                {group.label}
              </p>
            )}
            {group.items.map((item) => (
              <a
                target="_blank"
                rel="noreferrer"
                href={item.href}
                onClick={() => onSourceClick(item)}
                key={`husky-chat${item.key}`}
                className="sources__item"
              >
                <div className="sources__item__head">
                  <p className="sources__item__head__title">{item.title}</p>
                </div>
              </a>
            ))}
          </div>
        ))}
      </div>
      <style jsx>
        {`
          .sources {
            width: 280px;
            display: flex;
            width: 270px;
            flex-direction: column;
            gap: 8px;
            padding: 12px 16px;
            max-height: 200px;
            overflow-y: scroll;
          }
          .sources__title {
            padding-bottom: 8px;
          }
          .sources__group {
            display: flex;
            flex-direction: column;
            gap: 8px;
          }
          .sources__group__label {
            color: #64748b;
            font-size: 11px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.02em;
          }
          .sources__item {
            padding: 8px 10px;
            border: 1px solid #e2e8f0;
            border-radius: 4px;
            display: flex;
            flex-direction: column;
            gap: 12px;
            word-break: break-word;
          }
          .sources__item__body {
            display: -webkit-box;
            -webkit-line-clamp: 1;
            -webkit-box-orient: vertical;
            overflow: hidden;
            text-overflow: ellipsis;
            text-decoration: none;
            font-size: 12px;
            font-weight: 400;
          }
          .sources__item__head {
            display: flex;
            gap: 8px;
            align-items: center;
          }
          .sources__item__head__index {
            width: 18px;
            height: 18px;
            border-radius: 50%;
            background: #e2e8f0;
            font-size: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .sources__item__head__title {
            font-size: 12px;
            font-weight: 500;
            white-space: normal;
          }

          @media (min-width: 1024px) {
            .sources {
              width: 327px;
            }
          }
        `}
      </style>
    </>
  );
}

export default HuskySourceCard;
