'use client';

import React, { type ReactNode } from 'react';
import MarkdownToJSX from 'markdown-to-jsx';
import { PreviewCard } from '@base-ui-components/react/preview-card';
import clsx from 'clsx';

import { ArrowUpRightIcon } from '@/components/icons';

import { mentionFor, type SourceRef } from './entities';
import s from './AnswerProse.module.scss';

/**
 * The answer's prose. Proposed replacement for production's `Markdown`
 * (components/common/Markdown.tsx) as it is used inside an answer.
 *
 * Same library (markdown-to-jsx), different overrides:
 *
 * - **Rhythm.** Production pins every <p> to 14px/22px with a 6px gap through
 *   inline styles, and the answer card around it sets 26px leading — two
 *   values fighting. Here the wrapper owns one rhythm (16/26 on desktop, the
 *   reading size every current answer surface uses), 12px between paragraphs,
 *   lists with tertiary markers and 4px between items. No inline styles, so a
 *   host can change it in one place.
 * - **Entity mentions.** A link to a directory record ("Lumen Storage") is the
 *   record, not a URL: it gets the record's 16px picture and the primary ink,
 *   with a hairline underline that turns brand on hover. Production paints
 *   every link `style={{ color: 'blue' }}` (#0000ff, not a PL colour), which is
 *   most of why the answer looks like an old web page.
 * - **Citations.** A `[n](url)` link is a source marker (production's
 *   `sourceRefs` contract). Production prints it as blue "[1]" text; here it
 *   is a small grey number pill, and hovering it shows the source as a card
 *   (title, type · host, open arrow) — ChatGPT's and Perplexity's citation
 *   chips. The number matches the row in the Sources list.
 * - **Streaming.** While words arrive, a brand caret blinks at the end of the
 *   last line, so "still writing" is visible where the reader's eye already is.
 */
export function AnswerProse({
  markdown,
  refs,
  streaming,
}: {
  markdown: string;
  refs: SourceRef[];
  streaming: boolean;
}) {
  const Anchor = ({ href = '', children }: { href?: string; children?: ReactNode }) => {
    const text = React.Children.toArray(children).join('');
    const n = Number(text);
    if (text && !Number.isNaN(n)) {
      const ref = refs.find((r) => r.index === n);
      return <Citation n={n} href={ref?.href ?? href} source={ref} />;
    }
    const mention = mentionFor(href);
    if (mention) {
      return (
        <a className={s.mention} href={href}>
          <img
            className={clsx(s.mentionPic, mention.type !== 'member' && s.mentionLogo)}
            src={mention.picture}
            alt=""
            width={16}
            height={16}
          />
          {children}
        </a>
      );
    }
    const external = /^https?:/i.test(href);
    return (
      <a className={s.link} href={href} target={external ? '_blank' : undefined} rel={external ? 'noreferrer' : undefined}>
        {children}
      </a>
    );
  };

  return (
    <div className={s.prose}>
      <MarkdownToJSX
        options={{
          forceBlock: true,
          overrides: {
            a: { component: Anchor },
            /* Bold around a mention adds nothing the mention doesn't already say. */
            strong: { component: StrongOrMention },
            Caret: { component: Caret },
          },
        }}
      >
        {streaming ? `${markdown} <Caret></Caret>` : markdown}
      </MarkdownToJSX>
    </div>
  );
}

/* `**[Lumen Storage](/teams/…)**` — the mocks bold every entity link. The
   mention carries its own weight, so the bold steps aside for it. */
function StrongOrMention({ children }: { children?: ReactNode }) {
  const only = React.Children.toArray(children);
  if (only.length === 1 && React.isValidElement(only[0])) return <>{children}</>;
  return <strong>{children}</strong>;
}

function Caret() {
  return <span className={s.caret} aria-hidden="true" />;
}

function Citation({ n, href, source }: { n: number; href: string; source?: SourceRef }) {
  const external = /^https?:/i.test(href) && !href.includes('directory.plnetwork.io');
  return (
    <PreviewCard.Root delay={150}>
      <PreviewCard.Trigger
        className={s.cite}
        href={href}
        target={external ? '_blank' : undefined}
        rel={external ? 'noreferrer' : undefined}
        aria-label={source ? `Source ${n}: ${source.title}` : `Source ${n}`}
      >
        {n}
      </PreviewCard.Trigger>
      {source && (
        <PreviewCard.Portal>
          <PreviewCard.Positioner className={s.cardPositioner} side="top" align="start" sideOffset={6}>
            <PreviewCard.Popup className={s.card}>
              <span className={s.cardHead}>
                {source.picture ? (
                  <img className={s.cardPic} src={source.picture} alt="" width={20} height={20} />
                ) : (
                  <span className={s.cardMark} aria-hidden="true">
                    {source.title.charAt(0)}
                  </span>
                )}
                <span className={s.cardOrigin}>{source.origin}</span>
              </span>
              <span className={s.cardTitle}>{source.title}</span>
              <span className={s.cardOpen}>
                Open
                <ArrowUpRightIcon width={14} height={14} />
              </span>
            </PreviewCard.Popup>
          </PreviewCard.Positioner>
        </PreviewCard.Portal>
      )}
    </PreviewCard.Root>
  );
}
