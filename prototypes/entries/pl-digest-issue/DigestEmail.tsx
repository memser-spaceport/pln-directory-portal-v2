'use client';

import clsx from 'clsx';

// The Monday digest's email shell, imported rather than rebuilt: stage, client
// chrome with the subject counter, white card, masthead, lead band, sections
// and footer. Every email preview in the prototypes wears it.
import digest from '../newsfeed/Newsfeed.module.scss';

import { EDITION, EMAIL_FROM, EMAIL_TO, issueHref, type Story } from './mocks';
import s from './PlDigestIssue.module.scss';

/** Same 60-character budget the other email previews count against. */
const SUBJECT_BUDGET = 60;

/** The first sentence or two of a story body, for a teaser. */
function teaser(story: Story) {
  const first = story.body[0] ?? '';
  const sentences = first.match(/[^.]+\.(\s|$)/g) ?? [first];
  return sentences.slice(1, 3).join('').trim() || first;
}

type TeaserRow = { chip: string; title: string; meta: string; anchor: string };

/** Two stories per cohort plus the take and the deals row: the issue's spine, not all of it. */
function teaserRows(): TeaserRow[] {
  const pick = (section: Story['section']) => EDITION.stories.filter((st) => st.section === section).slice(0, 2);
  const deal = EDITION.deals.rows[0];
  const storyRow = (chip: string) => (st: Story) => ({
    chip,
    title: `${st.team.name}${st.headlineRest ?? ''}`,
    meta: st.date,
    anchor: st.id,
  });
  return [
    {
      chip: 'Deals',
      title: `${deal.team.name} closed a ${deal.amount} ${deal.round}`,
      meta: `Announced ${deal.announced}`,
      anchor: 'deals',
    },
    ...pick('founders').map(storyRow('Founders')),
    ...pick('investors').map(storyRow('Investors')),
    { chip: 'Editor’s take', title: EDITION.take.title, meta: 'Opinion', anchor: 'take' },
  ];
}

/**
 * The teaser email. One job: get the reader into the issue page. One primary
 * door (Read the full issue), then a short list where each line opens its own
 * story on the page.
 */
export function DigestEmail() {
  const lead = EDITION.stories.find((st) => st.section === 'lead')!;
  const subjectLength = EDITION.subject.length;

  return (
    <div className={clsx(digest.emailPage, s.emailPage)}>
      <div className={clsx(digest.emailWrap, s.emailWrap)}>
        <div className={digest.emailStage}>
          <div className={digest.clientBar}>
            <div className={digest.clientRow}>
              <span className={digest.clientLabel}>From</span>
              <span className={digest.clientValue}>{EMAIL_FROM}</span>
            </div>
            <div className={digest.clientRow}>
              <span className={digest.clientLabel}>To</span>
              <span className={digest.clientValue}>{EMAIL_TO}</span>
            </div>
            <div className={digest.clientRow}>
              <span className={digest.clientLabel}>Subject</span>
              <span className={clsx(digest.clientValue, digest.clientSubject)}>
                {EDITION.subject}
                <span className={clsx(digest.charCount, subjectLength > SUBJECT_BUDGET && digest.charCountOver)}>
                  {subjectLength}/{SUBJECT_BUDGET}
                </span>
              </span>
            </div>
            <div className={digest.clientRow}>
              <span className={digest.clientLabel}>Preview</span>
              <span className={digest.clientValue}>{EDITION.preheader}</span>
            </div>
          </div>

          <div className={digest.email}>
            <div className={digest.emailHead}>
              <p className={clsx(digest.masthead, s.emailMasthead)}>PL Network Digest</p>
              <p className={digest.emailWeek}>
                {EDITION.number} · {EDITION.dateLabel}
              </p>
            </div>

            <div className={digest.emailTop}>
              <p className={digest.emailKicker}>The lead</p>
              <h1 className={digest.emailTopTitle}>{lead.headline}</h1>
              <p className={digest.emailTopSummary}>{teaser(lead)}</p>
              <a className={digest.emailCta} href={issueHref('lead')}>
                Read the full issue
              </a>
              <p className={digest.emailSourceLine}>
                {lead.date} · Sources:{' '}
                {lead.sources.map((src, i) => (
                  <span key={src.href}>
                    {i > 0 && ', '}
                    <a className={s.emailSourceLink} href={src.href} target="_blank" rel="noreferrer">
                      {src.label}
                    </a>
                  </span>
                ))}
              </p>
            </div>

            <div className={digest.emailSection}>
              <h2 className={digest.emailSectionTitle}>Also in this issue</h2>
              <ul className={digest.emailList}>
                {teaserRows().map((row) => (
                  <li key={row.anchor} className={digest.emailItem}>
                    <span className={clsx(digest.emailChip, s.emailChip)}>{row.chip}</span>
                    <a className={digest.emailItemLink} href={issueHref(row.anchor)}>
                      {row.title}
                    </a>
                    <span className={digest.emailItemTeam}>{row.meta}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className={digest.emailFoot}>
              <p>
                What did your team ship in the last two weeks? Reply with one line and a link, and it can go into the
                next issue.
              </p>
              <p>
                You get this because you are a LabOS member. <a href="#preferences">Email preferences</a> ·{' '}
                <a href="#unsubscribe">Unsubscribe</a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
