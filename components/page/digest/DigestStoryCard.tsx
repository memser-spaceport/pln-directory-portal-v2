import { SafeHtml } from '@/components/ui/SafeHtml';
import type { DigestChoice, DigestStory } from '@/services/digest/digest.types';
import type { DigestReceiptPlace } from '@/services/digest/hooks/useDigestChoices';

import { DigestFeedbackButtons } from './DigestFeedbackButtons';
import { DigestReceipt } from './DigestReceipt';
import topStoryBg from './assets/top-story-bg.png';

import s from './DigestPage.module.scss';

type Props = {
  story: DigestStory;
  /** Index on the page: odd cards put the image on the left, as in the email. */
  index: number;
  choice: DigestChoice | null;
  receipt: DigestReceiptPlace | undefined;
  onPress: (kind: DigestChoice) => void;
  onUndo: () => void;
  onRead: () => void;
};

/** One news story, in full. */
export function DigestStoryCard({ story, index, choice, receipt, onPress, onUndo, onRead }: Props) {
  const confirmation = choice && receipt ? <DigestReceipt choice={choice} onUndo={onUndo} /> : null;
  const image = storyImage(story);
  const source = story.sourceDomain || hostOf(story.sourceUrl);

  return (
    <article
      id={`story-${story.uid}`}
      className={[s.card, index % 2 === 1 ? s.cardImageLeft : ''].filter(Boolean).join(' ')}
      style={story.isTopStory ? { ['--card-bg-image' as string]: `url(${topStoryBg.src})` } : undefined}
    >
      {story.isTopStory && <span aria-hidden className={s.cardBgImage} />}

      {receipt === 'top' && confirmation}

      <div className={s.cardTop}>
        <div className={s.cardText}>
          {story.isTopStory && <span className={s.topBadge}>🔥 Top story</span>}
          <h2 className={s.cardTitle}>{story.title}</h2>
          {story.summary && <p className={s.cardSummary}>{story.summary}</p>}
        </div>
        {image && (
          <div className={s.cardImage}>
            <img src={image.src} srcSet={image.srcSet} sizes="(max-width: 639px) 100vw, 216px" alt="" />
          </div>
        )}
      </div>

      {story.contentHtml && <SafeHtml html={story.contentHtml} className={`${s.cardBody} ${s.html}`} />}

      <div className={s.cardFooter}>
        <a href={story.sourceUrl} target="_blank" rel="noopener noreferrer" className={s.readSource} onClick={onRead}>
          Read on {source}
        </a>
        <DigestFeedbackButtons choice={choice} onPress={onPress} />
      </div>

      {receipt === 'under' && confirmation}
    </article>
  );
}

function storyImage(story: DigestStory): { src: string; srcSet?: string } | null {
  const variants = story.image?.variants ?? [];
  if (variants.length > 0) {
    // Narrowest first; the card shows at most 216px wide on desktop, full width on a phone.
    const fit = variants.find((v) => v.width >= 432) ?? variants[variants.length - 1];
    return { src: fit.url, srcSet: variants.map((v) => `${v.url} ${v.width}w`).join(', ') };
  }
  return story.imageUrl ? { src: story.imageUrl } : null;
}

function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return 'the source';
  }
}
