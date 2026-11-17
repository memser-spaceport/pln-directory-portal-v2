import { NewspaperIcon } from '@phosphor-icons/react';

import type { DigestNetworkNews as Item } from '@/services/digest/digest.types';

import s from './DigestNetworkNews.module.scss';

type Props = {
  items: Item[];
  onOpen: (item: Item, position: number) => void;
};

/**
 * "More from the network" (LAB-3291, the digest-web prototype's DigestNetworkNews): the rest of the week's press
 * about network teams, after the picked stories. One row each: picture, headline, outlet · date. A row opens the
 * article at its outlet in a new tab.
 */
export function DigestNetworkNews({ items, onOpen }: Props) {
  return (
    <section className={s.section} aria-labelledby="digest-network-news-title">
      <div className={s.head}>
        <h2 id="digest-network-news-title" className={s.title}>
          More from the network
        </h2>
        <p className={s.subtitle}>Network teams in the press.</p>
      </div>

      <ul className={s.list}>
        {items.map((item, position) => {
          const image = thumbnail(item);
          return (
            <li key={item.uid}>
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className={s.row}
                onClick={() => onOpen(item, position)}
              >
                {image ? (
                  <img
                    src={image.src}
                    srcSet={image.srcSet}
                    sizes="120px"
                    alt=""
                    className={s.thumb}
                    width={120}
                    height={80}
                    loading="lazy"
                  />
                ) : (
                  // No picture: a quiet tile keeps the headlines in one column.
                  <span className={`${s.thumb} ${s.thumbEmpty}`} aria-hidden>
                    <NewspaperIcon size={24} />
                  </span>
                )}
                <span className={s.text}>
                  <span className={s.name}>{item.title}</span>
                  <span className={s.meta}>{[item.domain, shortDate(item.eventDate)].filter(Boolean).join(' · ')}</span>
                </span>
              </a>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** "25 Sep", in UTC and from a fixed month list, so the server and the browser render the same text. */
function shortDate(iso: string): string | null {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return `${date.getUTCDate()} ${MONTHS[date.getUTCMonth()]}`;
}

function thumbnail(item: Item): { src: string; srcSet?: string } | null {
  const variants = item.image?.variants ?? [];
  if (variants.length > 0) {
    // Narrowest first; the picture shows 120px wide, so 240px covers a 2x screen.
    const fit = variants.find((v) => v.width >= 240) ?? variants[variants.length - 1];
    return { src: fit.url, srcSet: variants.map((v) => `${v.url} ${v.width}w`).join(', ') };
  }
  return item.imageUrl ? { src: item.imageUrl } : null;
}
