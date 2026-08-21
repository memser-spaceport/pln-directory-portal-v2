'use client';

import { getContactLogoByProvider } from '@/utils/profile/getContactLogoByProvider';
// The rail's own card chrome, so this sits beside BookWithOther and the team
// updates card as a peer rather than as a third kind of box.
import book from '@/components/page/member-details/BookWithOther/BookWithOther.module.scss';

import { BlueskyPostCard } from './BlueskyPostCard';
import { MOCK_BLUESKY_HANDLE, MOCK_BLUESKY_POSTS, MOCK_BLUESKY_PROFILE_URL, POSTS_SHOWN } from './activityMocks';
import s from './MemberProfile.module.scss';

interface Props {
  /** Account connected and posts shared — render the posts. */
  showsBluesky: boolean;
  /** Viewer is the profile owner. */
  isOwner: boolean;
  /** Owner has no account connected — render the prompt instead. */
  notConnected?: boolean;
}

/**
 * The member's Bluesky, as a rail card.
 *
 * The rail is where this page already puts side signals: who owns the
 * relationship, what the teams have been doing, who else is bookable. Someone's
 * Bluesky is the same kind of thing — worth a glance while you decide whether to
 * reach out, not worth a third of the main column.
 *
 * The cost is width. At 300px the author line goes (the header names the account
 * once), the body clamps to four lines, and a link card's description drops to
 * one. What survives is the part that makes it a post rather than a summary:
 * the media, the unfurled link, and the counts.
 */
export function BlueskyRailCard({ showsBluesky, isOwner, notConnected }: Props) {
  // A visitor looking at a member with no Bluesky gets nothing — see the note on
  // ACTIVITY_SCENARIOS. Resolved here rather than at the call site so the two
  // mounts (rail + mobile) can't disagree about it.
  if (!showsBluesky) {
    return isOwner && notConnected ? <ConnectPrompt /> : null;
  }

  const posts = MOCK_BLUESKY_POSTS.slice(0, POSTS_SHOWN);

  return (
    <div className={book.root}>
      <CardHeader />
      {/* Names the account once, so neither post below has to carry an author
          line — the one thing a 300px column genuinely cannot afford. */}
      <div className={s.blueskyHandle}>@{MOCK_BLUESKY_HANDLE}</div>

      <div className={s.blueskyList}>
        {posts.map((post) => (
          <BlueskyPostCard key={post.id} post={post} />
        ))}
      </div>

      {isOwner && (
        <p className={s.ownerNote}>
          Shown to anyone who can see your profile.{' '}
          <a className={s.ownerNoteLink} href="#contact-details">
            Change this in Contact details
          </a>
        </p>
      )}

      {/* Named for where it lands, and shaped like the rail's other exit
          (MemberTeamUpdates' "All network updates"). */}
      <a className={book.button} href={MOCK_BLUESKY_PROFILE_URL} target="_blank" rel="noreferrer">
        View Bluesky profile
      </a>
    </div>
  );
}

/**
 * The owner's own profile, no account connected.
 *
 * This is an offer, not an empty state — the difference matters and it is why
 * only the owner sees it. The profile already asks this way: the header renders
 * "+ Your Role", "+ Your Location", "Add skills" and "Add bio" ghost affordances
 * exactly where the missing thing goes. This is that pattern at rail scale, and
 * `BookWithOther`'s shell is already the shape of it — a line saying what isn't
 * there, a line saying what you can do, one button.
 *
 * The header stays identical to the connected state so this reads as the same
 * card in a different condition rather than as a different card. The body copy
 * names the outcome ("show your recent posts on your profile"), not the
 * mechanism — nobody connects an account for its own sake.
 */
function ConnectPrompt() {
  return (
    <div className={book.root}>
      <CardHeader />
      <div className={book.body}>Connect your Bluesky account to show your recent posts on your profile.</div>
      {/* Inert: the prototype has no OAuth. The real control belongs in Contact
          details beside the handle, which is where the owner note in the
          connected state points. */}
      <button type="button" className={book.button}>
        Connect Bluesky
      </button>
    </div>
  );
}

/** Shared so the connected and connect-prompt states are visibly one card. */
function CardHeader() {
  return (
    <div className={`${book.header} ${s.blueskyHeader}`}>
      <span className={s.blueskyLogo}>
        <img src={getContactLogoByProvider('bluesky')} alt="" width={20} height={20} />
      </span>
      On Bluesky
    </div>
  );
}
