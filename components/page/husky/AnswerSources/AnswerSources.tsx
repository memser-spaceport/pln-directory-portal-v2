import type { HuskySourceRef } from '@/services/husky/hooks/useHuskyChat';

import { sourceItems } from '@/components/utils/sourceItems';

import { useHuskyAnalytics } from '@/analytics/husky.analytics';

import s from './AnswerSources.module.scss';

interface Props {
  sources?: string[];
  sourceRefs?: HuskySourceRef[];
}

export const AnswerSources = (props: Props) => {
  const { sources, sourceRefs } = props;

  const { trackHuskySourceLinkClicked } = useHuskyAnalytics();
  const items = sourceItems(sources, sourceRefs);

  if (items.length === 0) {
    return null;
  }

  return (
    <section className={s.root} aria-label="Sources">
      <h3 className={s.title}>Sources</h3>
      <ol className={s.list}>
        {items.map((item) => (
          <li key={`answer-source-${item.key}`}>
            <a
              target="_blank"
              rel="noreferrer"
              href={item.href}
              onClick={() => trackHuskySourceLinkClicked(item.href)}
              className={s.link}
            >
              {item.title}
            </a>
          </li>
        ))}
      </ol>
    </section>
  );
};
