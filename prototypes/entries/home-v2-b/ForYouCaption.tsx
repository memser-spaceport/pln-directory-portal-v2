'use client';

import Link from 'next/link';

import local from './HomeV2B.module.scss';

/**
 * Production `ForYouHint`'s words, verbatim, in a layout that reads as a caption
 * on the stream instead of a grey slab of text:
 * - the profile glyph (production's `profile-blue.svg`, the settings menu's
 *   Profile icon) on a brand-soft tile says "this is about you" before a word is read;
 *   the card itself stays white, so the blue Top stories band under it keeps the only tinted ground;
 * - "For you" is the caption's title on its own line, not a "For you:" prefix
 *   inside the sentence;
 * - the action sentence never breaks inside (newsfeed's ForYouBanner rule), so
 *   "relevant." is never left alone on a line.
 */
export function ForYouCaption() {
  return (
    <div className={local.forYou}>
      <span className={local.forYouIcon} aria-hidden>
        <img src="/icons/profile-blue.svg" alt="" width={16} height={16} />
      </span>
      <p className={local.forYouText}>
        <span className={local.forYouTitle}>For you</span>
        Curated based on your profile, primary team attributes, and the teams you follow.{' '}
        <span className={local.forYouAction}>
          <Link href="/settings/profile" className={local.forYouLink}>
            Update your profile
          </Link>{' '}
          to make it more relevant.
        </span>
      </p>
    </div>
  );
}
