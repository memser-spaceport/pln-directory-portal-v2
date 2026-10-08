'use client';

import { useHuskyAnalytics } from '@/analytics/husky.analytics';
import { sourceItems } from '@/components/utils/sourceItems';
import type { HuskySourceRef } from '@/services/husky/hooks/useHuskyChat';

interface HuskySourceCardProps {
  sources?: string[];
  sourceRefs?: HuskySourceRef[];
}

function HuskySourceCard({ sources, sourceRefs }: HuskySourceCardProps) {
  const { trackHuskySourceLinkClicked } = useHuskyAnalytics();
  const items = sourceItems(sources, sourceRefs);
  return (
    <>
      <div className="sources">
        <h3 className="sources__title">Sources</h3>
        {items.map((item) => (
          <a
            target="_blank"
            rel="noreferrer"
            href={item.href}
            onClick={() => trackHuskySourceLinkClicked(item.href)}
            key={`husky-chat${item.key}`}
            className="sources__item"
          >
            <div className="sources__item__head">
              <p className="sources__item__head__title">{item.title}</p>
            </div>
          </a>
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
