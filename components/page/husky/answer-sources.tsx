import { useHuskyAnalytics } from '@/analytics/husky.analytics';
import { sourceItems } from '@/components/core/husky/husky-source-card';
import type { HuskySourceRef } from '@/services/husky/hooks/useHuskyChat';

interface AnswerSourcesProps {
  sources?: string[];
  sourceRefs?: HuskySourceRef[];
}

// Sources listed after the answer text on the AI Search page (the search dialog keeps its "N source(s)" pill).
const AnswerSources = ({ sources, sourceRefs }: AnswerSourcesProps) => {
  const { trackHuskySourceLinkClicked } = useHuskyAnalytics();
  const items = sourceItems(sources, sourceRefs);

  if (items.length === 0) {
    return null;
  }

  return (
    <>
      <section className="answer-sources" aria-label="Sources">
        <h3 className="answer-sources__title">Sources</h3>
        <ol className="answer-sources__list">
          {items.map((item) => (
            <li key={`answer-source-${item.key}`} className="answer-sources__item">
              <a
                target="_blank"
                rel="noreferrer"
                href={item.href}
                onClick={() => trackHuskySourceLinkClicked(item.href)}
                className="answer-sources__link"
              >
                {item.title}
              </a>
            </li>
          ))}
        </ol>
      </section>
      <style jsx>{`
        .answer-sources {
          display: flex;
          flex-direction: column;
          gap: 8px;
          padding-top: 12px;
          border-top: 1px solid #e2e8f0;
        }

        .answer-sources__title {
          font-size: 12px;
          font-weight: 600;
          line-height: 16px;
          color: #475569;
        }

        .answer-sources__list {
          display: flex;
          flex-direction: column;
          gap: 4px;
          margin: 0;
          padding-inline-start: 18px;
          color: #64748b;
          font-size: 12px;
          line-height: 18px;
        }

        .answer-sources__link {
          color: #156ff7;
          word-break: break-word;
        }

        .answer-sources__link:hover {
          text-decoration: underline;
        }
      `}</style>
    </>
  );
};

export default AnswerSources;
