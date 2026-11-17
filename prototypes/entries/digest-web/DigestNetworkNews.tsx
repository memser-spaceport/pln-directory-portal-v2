'use client';

import ev from './DigestEvents.module.scss';
import s from './DigestNetworkNews.module.scss';

const unsplash = (id: string) => `https://images.unsplash.com/photo-${id}?w=320&q=70&auto=format&fit=crop`;

interface PressItem {
  id: string;
  title: string;
  outlet: string;
  date: string;
  url: string;
  image: string;
}

/** Mock: network teams in the press this week, beyond the five picked stories. Images reuse
 *  home-v2's Unsplash picks. */
export const DIGEST_PRESS: PressItem[] = [
  {
    id: 'precision-neuro',
    title: 'Precision Neuroscience raised $250M for brain-computer interface work',
    outlet: 'MedTech Dive',
    date: '25 Sep',
    url: 'https://www.medtechdive.com',
    image: unsplash('1518770660439-4636190af475'),
  },
  {
    id: 'formation-securities',
    title: 'Formation Securities plans an SEC-registered venue for tokenized securities on Solana',
    outlet: 'CryptoBriefing',
    date: '9 Nov',
    url: 'https://cryptobriefing.com',
    image: unsplash('1639762681485-074b7f938ba0'),
  },
  {
    id: 'tiger-data',
    title: 'Tiger Data (formerly Timescale) released pg_vectorsearch for PostgreSQL in alpha',
    outlet: 'InfoQ',
    date: '7 Nov',
    url: 'https://www.infoq.com',
    image: unsplash('1558494949-ef010cbdcc31'),
  },
  {
    id: 'aria-brain',
    title: 'ARIA funded ten teams in its £50M programme to reach the brain without surgery',
    outlet: 'ARIA',
    date: '5 Nov',
    url: 'https://www.aria.org.uk',
    image: unsplash('1451187580459-43490279c0fa'),
  },
];

/**
 * "More from the network" (Anuj, 2026-11-16; was "Network news"): the rest of the week's press about network teams, after the picked
 * stories. One row each: picture, headline, outlet · date. A row opens the article at its
 * outlet in a new tab, in the page and the email alike. Styled as the Upcoming events list
 * so the two sections read as one system.
 */
export function DigestNetworkNews({ asEmail, id }: { asEmail: boolean; id: string }) {
  return (
    <section id={id} className={`${ev.section} ${asEmail ? ev.sectionEmail : ''}`} aria-labelledby={`${id}-title`}>
      <div className={ev.head}>
        <h2 id={`${id}-title`} className={ev.title}>
          More from the network
        </h2>
        <p className={ev.subtitle}>Network teams in the press.</p>
      </div>

      <ul className={ev.list}>
        {DIGEST_PRESS.map((item) => (
          <li key={item.id}>
            <a href={item.url} target="_blank" rel="noopener noreferrer" className={ev.row}>
              <img src={item.image} alt="" className={s.thumb} width={120} height={80} />
              <span className={ev.text}>
                <span className={ev.name}>{item.title}</span>
                <span className={ev.meta}>
                  {item.outlet} · {item.date}
                </span>
              </span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
