'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';

import {
  DIGEST_LINK_TYPES,
  digestPageFrom,
  useDigestAnalytics,
  type DigestLinkType,
  type DigestSignInPromptPress,
  type DigestTopicsVia,
} from '@/analytics/digest.analytics';
import { isPrivyOAuthReturn } from '@/components/core/login/utils/privyOAuthReturn';
import { useCurrentUserStore } from '@/services/auth/store';
import type { DigestChoice, DigestIssue, DigestPageData } from '@/services/digest/digest.types';
import { useDigestChoices } from '@/services/digest/hooks/useDigestChoices';
import { useDigestFollows } from '@/services/digest/hooks/useDigestFollows';
import { useDigestTopics } from '@/services/digest/hooks/useDigestTopics';
import { feedQueryKeys } from '@/services/feed/constants';
import type { IFeedCommentCountsResponse } from '@/types/feed.types';

import { DigestForum } from './DigestForum';
import { DigestEvents } from './DigestEvents';
import { DigestHeader } from './DigestHeader';
import { DigestShareLink } from './DigestShareLink';
import { DigestNetworkNews } from './DigestNetworkNews';
import { DigestCaughtUp } from './DigestIssueEnd';
import { DigestPostNews } from './DigestPostNews';
import { DigestSidebar } from './DigestSidebar';
import { DigestSignInPrompt, type DigestSignInAsk } from './DigestSignInPrompt';
import { DigestTopicsSection } from './DigestTopicsSection';
import { DigestStoryCard } from './DigestStoryCard';
import { DigestTopicsModal } from './DigestTopicsModal';

import sb from './DigestSidebar.module.scss';
import s from './DigestPage.module.scss';

/** What a signed-out press asks for, carried through sign-in in the address (see `addressWith`). */
const SIGN_IN_INTENTS = ['topics', 'topic', 'postnews', 'follow', 'comments'] as const;
type SignInIntent = (typeof SIGN_IN_INTENTS)[number];
type Intent = { key: SignInIntent; value: string } | { story: string; choice: DigestChoice };

/** The sign-in prompt on show (LAB-3347): its words, the press that opened it, and where sign-in comes back to. */
type OpenPrompt = { ask: DigestSignInAsk; press: DigestSignInPromptPress; returnTo: string };

// Polina's prompt copy (LAB-3347, 2026-11-20): the title names the press, the line says why it needs an account.
const TOPICS_LINE = 'Your topics decide which stories your digest leads with.';

type Props = {
  /** The issue on show (LAB-3351): its key in the address and in choice saves. */
  issueUid: string;
  data: DigestPageData;
  isLoggedIn: boolean;
};

const asChoice = (value: string | null): DigestChoice | null => (value === 'more' || value === 'less' ? value : null);

/**
 * A footer link to the email settings (LAB-3351): `/settings/email`, which asks a signed-out reader to sign in, so a
 * forwarded page never changes the sender's settings. The email keeps its own signed links to `/digest/email`.
 */
function emailSettingsHref(linkType: 'manage' | 'unsubscribe') {
  const params = new URLSearchParams({ utm_source: `digest_page_${linkType}_link`, link_type: linkType });
  return `/settings/email?${params.toString()}`;
}

/**
 * One digest issue (LAB-3264; v2 open layout LAB-3287; by issue id LAB-3351), ported from the digest-web prototype.
 * Anyone can read it; the reader's own data comes with their session. More / Less, Follow, Comments, topics and
 * posting news act for the signed-in member and send a signed-out reader to sign-in. A More / Less link's choice is
 * saved here, after the page loads in the browser, so a link scanner that fetches the page changes nothing.
 */
export function DigestPage({ issueUid, data, isLoggedIn }: Props) {
  const searchParams = useSearchParams();
  const { choices, receipts, press, undo, land } = useDigestChoices(issueUid, data.stories);
  const analytics = useDigestAnalytics();
  const started = useRef(false);
  const router = useRouter();
  const queryClient = useQueryClient();
  const { currentUser, isHydrated } = useCurrentUserStore();
  const follows = useDigestFollows(data.stories);
  const topics = useDigestTopics(data.topics);
  const signedIn = isHydrated ? Boolean(currentUser) : undefined;
  // What the reader asked for before sign-in comes back in the address: `topics=open` (also the email's Change
  // topics) opens the modal, `topic=<slug>` ticks that chip in Suggested topics, `postnews=open` (also the email's "Post
  // your team news →") posts team news. Read once, on load.
  const [topicsOpen, setTopicsOpen] = useState(() => searchParams.get('topics') === 'open');
  const [pickOnReturn] = useState(() => searchParams.get('topic'));
  const [postOnLoad] = useState(() => searchParams.get('postnews') === 'open');
  // `follow=<team uid>` and `comments=<story uid>` (LAB-3347): Follow and Comments pressed before sign-in.
  const [followOnReturn] = useState(() => searchParams.get('follow'));
  const [commentsOnReturn] = useState(() => searchParams.get('comments'));
  const followed = useRef(false);
  const [prompt, setPrompt] = useState<OpenPrompt | null>(null);

  // An email link's address carries the link token: swap it for the issue id (LAB-3351), keeping every other
  // parameter and the `#story-` / `#post-` anchor, so a copied address never acts for the link's member. A layout
  // effect, so it runs before every effect that reads the address or sends the reader to sign-in from it (the page's
  // own and its children's). `null` state: see the __NA trap.
  useLayoutEffect(() => {
    const address = new URL(window.location.href);
    if (!address.searchParams.has('t') && address.searchParams.get('issue') === issueUid) return;
    const rest = [...address.searchParams].filter(([key]) => key !== 't' && key !== 'issue');
    const search = new URLSearchParams([['issue', issueUid], ...rest]).toString();
    window.history.replaceState(null, '', `${address.pathname}?${search}${address.hash}`);
  }, [issueUid]);

  // Back to this page after sign-in: the issue stays in the address, plus `extra` to pick up where they were. A More /
  // Less press comes back as `story` + `choice`, the same pair an older email's More / Less link carries.
  const addressWith = (extra?: Intent) => {
    const url = new URL(window.location.href);
    if (extra) {
      [...SIGN_IN_INTENTS, 'story', 'choice'].forEach((key) => url.searchParams.delete(key));
      if ('story' in extra) {
        url.searchParams.set('story', extra.story);
        url.searchParams.set('choice', extra.choice);
      } else {
        url.searchParams.set(extra.key, extra.value);
      }
    }
    return `${url.pathname}${url.search}`;
  };
  const goToLogin = useCallback((returnTo: string) => router.push(`${returnTo}#login`, { scroll: false }), [router]);
  // A signed-out press (LAB-3347): the sign-in prompt names it and says why; Sign in there finishes it.
  const ask = (press: DigestSignInPromptPress, words: DigestSignInAsk, extra?: Intent, returnTo = addressWith(extra)) =>
    setPrompt({ ask: words, press, returnTo });

  const signInToChoose = (story: string, choice: DigestChoice, via: DigestChoice | 'email-choice') => {
    analytics.onChoiceSignInPrompted({ via, newsId: story });
    ask(
      via,
      {
        title: `Sign in to get ${choice === 'more' ? 'more' : 'fewer'} stories like this`,
        line: 'Your choice shapes which stories lead your next digest.',
      },
      { story, choice },
    );
  };
  // The comments thread's own sign-in (a signed-in session that lapsed): straight to the login, as on Home.
  const signIn = useCallback(() => goToLogin(addressWith()), [goToLogin]);
  const signInToFollow = (teamUid: string, teamName: string) => {
    analytics.onSignInPrompted({ via: 'follow', teamUid });
    ask(
      'follow',
      { title: `Sign in to follow ${teamName}`, line: 'Their news comes first in your feed and your digest.' },
      { key: 'follow', value: teamUid },
    );
  };
  const signInForComments = (storyUid: string) => {
    analytics.onSignInPrompted({ via: 'comments', newsId: storyUid });
    ask(
      'comments',
      { title: 'Sign in to read and add comments', line: 'Comments on network stories are open to members.' },
      { key: 'comments', value: storyUid },
    );
  };
  const signInToPersonalize = () => {
    analytics.onSignInPrompted({ via: 'personalize' });
    ask('personalize', {
      title: 'Sign in to personalize your digest',
      line: 'Pick topics and follow teams, and your digest leads with them.',
    });
  };
  const signInForTopics = (via: DigestTopicsVia, extra: { key: 'topics' | 'topic'; value: string }) => {
    analytics.onTopicsSignInPrompted({ via });
    ask(
      `topics-${via}`,
      {
        title: extra.key === 'topic' ? `Sign in to add #${extra.value}` : 'Sign in to choose your topics',
        line: TOPICS_LINE,
      },
      extra,
    );
  };
  const answerPrompt = (action: 'sign-in' | 'close') => {
    if (!prompt) return;
    analytics.onSignInPromptAnswered({ press: prompt.press, action });
    setPrompt(null);
    if (action === 'sign-in') goToLogin(prompt.returnTo);
  };
  const openAllTopics = () => {
    if (signedIn === undefined) return;
    if (!signedIn) return signInForTopics('see-all', { key: 'topics', value: 'open' });
    analytics.onTopicsModalOpened({ via: 'see-all' });
    setTopicsOpen(true);
  };

  useEffect(() => {
    if (signedIn === undefined) return;
    if (!signedIn) {
      // An email link lands signed out: sign in first, then the address does what it asked. Not on the way back from
      // Google or GitHub, which still carries it: starting a sign-in again would throw away the one that is finishing
      // (LAB-3308). Change topics asks with the prompt (LAB-3347); "Post your team news →" goes straight to the login,
      // since the card it would act on is hidden from a signed-out reader.
      if (isPrivyOAuthReturn()) return;
      if (searchParams.get('topics') === 'open') signInForTopics('email', { key: 'topics', value: 'open' });
      else if (postOnLoad) goToLogin(addressWith());
      return;
    }
    // Back from a sign-in that Follow started (LAB-3347): follow that team, once.
    const followStory = data.stories.find((story) => story.teamUid === followOnReturn);
    if (followStory && !followed.current) {
      followed.current = true;
      follows.follow(followStory.teamUid, followStory.teamName);
    }
    // Back from a sign-in that Comments started: the story's thread opens (DigestStoryCard); bring it into view.
    if (commentsOnReturn) document.getElementById(`story-${commentsOnReturn}`)?.scrollIntoView({ block: 'start' });
    // Signed in: the intent is applied, so a reload doesn't repeat it. `null` state: see the __NA trap.
    const url = new URL(window.location.href);
    if (!SIGN_IN_INTENTS.some((key) => url.searchParams.has(key))) return;
    SIGN_IN_INTENTS.forEach((key) => url.searchParams.delete(key));
    window.history.replaceState(null, '', `${url.pathname}${url.search}${url.hash}`);
    // Once the auth state is known; the address is read from the window, not from searchParams.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signedIn]);

  const topicsCard = {
    followed: topics.followed,
    suggested: topics.suggested,
    canSave: topics.canSave,
    signedIn,
    initialPick: pickOnReturn,
    onSave: (next: string[]) => topics.save(next, 'card'),
    onOpenAll: openAllTopics,
    onSignIn: (slug: string) => signInForTopics('chip', { key: 'topic', value: slug }),
  };
  // Signed out, the explainer says what this reader sees; the server knows that before the auth store hydrates.
  const personalize = {
    signedOut: signedIn === false || (signedIn === undefined && !isLoggedIn),
    onSignIn: signInToPersonalize,
  };
  // From the forum (LAB-3355): only for a signed-in member with forum access. The backend sends posts to no one else;
  // a locked post (an older backend's) or a session that has ended in this browser shows no section either.
  const forumPosts = signedIn === false ? [] : data.forumPosts.filter((post) => !post.locked);
  // Past issues open by id (LAB-3351); an issue the backend never recorded has none, so no link.
  const issuesCard = {
    issues: data.issues,
    current: data.sentAt,
    hrefFor: (row: DigestIssue) => (row.uid ? `/digest?issue=${encodeURIComponent(row.uid)}` : null),
  };

  useEffect(() => {
    // The page read already counted each story's comments: seed the feed's shared counts entry so Comments shows the
    // number without another request. Values already there (a comment just posted) win.
    queryClient.setQueryData<IFeedCommentCountsResponse>(feedQueryKeys.commentCounts(), (old) => ({
      ...Object.fromEntries(data.stories.map((story) => [story.uid, story.commentCount])),
      ...old,
    }));
  }, [queryClient, data.stories]);

  useEffect(() => {
    // Once per page load, Strict Mode included (refs survive its remount).
    if (started.current) return;
    started.current = true;

    const hash = window.location.hash.slice(1);
    const linkType = searchParams.get('link_type');
    const landedStory = searchParams.get('story');
    const landedChoice = asChoice(searchParams.get('choice'));

    if (linkType && (DIGEST_LINK_TYPES as readonly string[]).includes(linkType)) {
      analytics.onEmailLinkClicked({
        linkType: linkType as DigestLinkType,
        utmSource: searchParams.get('utm_source'),
        position: searchParams.get('position'),
        newsId: landedStory ?? (hash.startsWith('story-') ? hash.slice('story-'.length) : null),
        topicId: hash.startsWith('post-') ? hash.slice('post-'.length) : null,
      });
    }
    analytics.onPageViewed({
      frequency: data.frequency,
      sentAt: data.sentAt,
      from: digestPageFrom(linkType ?? (landedChoice ? landedChoice : null)),
      isLoggedIn,
    });

    // Scroll only: no mark on the item. An id that isn't on the page leaves the page at the top.
    const target = /^(story|post)-/.test(hash) ? document.getElementById(hash) : null;
    const landing = landedStory && landedChoice && data.stories.some((story) => story.uid === landedStory);
    (target ?? (landing ? document.getElementById(`story-${landedStory}`) : null))?.scrollIntoView({
      block: 'start',
      behavior: 'instant',
    });

    // Runs once for the landing only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // `story` + `choice` in the address: an older email's More / Less link, or a press made before sign-in. Saved for the
  // signed-in reader once the auth state is known; a signed-out reader is asked to sign in once, and never while a
  // Google or GitHub sign-in is returning (LAB-3308), which would throw that sign-in away.
  // `prompted` still saves once signed in: sign-in may finish without a reload.
  const landed = useRef<'prompted' | 'saved' | null>(null);
  useEffect(() => {
    if (signedIn === undefined || landed.current === 'saved') return;
    const story = searchParams.get('story');
    const choice = asChoice(searchParams.get('choice'));
    if (!story || !choice || !data.stories.some((item) => item.uid === story)) return;
    if (!signedIn) {
      if (landed.current) return;
      landed.current = 'prompted';
      if (!isPrivyOAuthReturn()) signInToChoose(story, choice, 'email-choice');
      return;
    }
    landed.current = 'saved';
    void land(story, choice).then((ok) => {
      if (!ok) return;
      // Drop the choice from the address so a reload doesn't save again. `null` state: see the __NA trap.
      const url = new URL(window.location.href);
      url.searchParams.delete('story');
      url.searchParams.delete('choice');
      window.history.replaceState(null, '', `${url.pathname}${url.search}${url.hash}`);
    });
    // Once the auth state is known; the landing pair is read once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signedIn]);

  const onPress = (uid: string, position: number, kind: DigestChoice) => {
    // Signed out (LAB-3351): nothing is saved or shown pressed; back from sign-in the choice is saved for the reader.
    if (signedIn === undefined) return;
    if (!signedIn) return signInToChoose(uid, kind, kind);
    const previous = choices[uid];
    const next = press(uid, kind);
    if (previous === kind) {
      analytics.onUndoClicked({ newsId: uid, choiceReverted: kind, via: 'second-press' });
    } else {
      analytics.onChoiceClicked({ kind, newsId: uid, position, activeAfter: next === kind });
    }
  };

  const onUndo = (uid: string) => {
    const reverted = choices[uid];
    if (reverted) analytics.onUndoClicked({ newsId: uid, choiceReverted: reverted, via: 'undo-button' });
    undo(uid);
  };

  return (
    <div className={`${s.page} ${s.pageWeb}`}>
      <div className={s.webLayout}>
        <article className={s.email}>
          <DigestHeader
            frequency={data.frequency}
            sentAt={data.sentAt}
            storyCount={data.stories.length}
            firstName={data.firstName}
            action={<DigestShareLink issueUid={issueUid} uid={signedIn ? currentUser?.uid : undefined} />}
          />

          {/* Under 1100px the topics section comes right after the header; from 1100px it opens the side column. */}
          <div className={sb.top}>
            <DigestTopicsSection variant="top" topics={topicsCard} personalize={personalize} />
          </div>

          <div className={s.spacer} />

          <div className={s.cards}>
            {data.stories.map((story, index) => (
              <DigestStoryCard
                key={story.uid}
                story={story}
                index={index}
                choice={choices[story.uid] ?? null}
                receipt={receipts[story.uid]}
                onPress={(kind) => onPress(story.uid, story.position, kind)}
                onUndo={() => onUndo(story.uid)}
                onRead={() => analytics.onStoryRead({ newsId: story.uid, position: story.position })}
                following={follows.isFollowing(story.teamUid)}
                onFollow={
                  isHydrated
                    ? () =>
                        currentUser
                          ? follows.toggle(story.teamUid, story.teamName)
                          : signInToFollow(story.teamUid, story.teamName)
                    : undefined
                }
                onSignIn={signIn}
                onCommentsSignIn={signedIn === false ? () => signInForComments(story.uid) : undefined}
                openComments={signedIn === true && commentsOnReturn === story.uid}
              />
            ))}
          </div>

          {data.networkNews.length > 0 && (
            <>
              <div className={s.spacer} />
              <DigestNetworkNews
                items={data.networkNews}
                onOpen={(item, position) =>
                  analytics.onNetworkNewsClicked({ newsId: item.uid, position, domain: item.domain })
                }
              />
            </>
          )}

          {data.events.items.length > 0 && (
            <>
              <div className={s.spacer} />
              <DigestEvents events={data.events.items} total={data.events.total} signedIn={signedIn} />
            </>
          )}

          {forumPosts.length > 0 && (
            <>
              <div className={s.spacer} />
              <DigestForum posts={forumPosts} signedIn={signedIn} />
            </>
          )}

          <DigestCaughtUp nextSendAt={data.nextSendAt} />

          {/* Under 1100px there's no room beside the column: Past issues closes the page instead. */}
          <DigestSidebar variant="inline" topics={topicsCard} personalize={personalize} issues={issuesCard} />

          {/* For team members only, so hidden from a signed-out reader, whose team is unknown (LAB-3347). */}
          {data.isTeamMember && signedIn !== false && <DigestPostNews openOnLoad={postOnLoad} onSignIn={signIn} />}

          <footer>
            <div className={s.signoff}>
              <p className={s.signoffStrong}>Cheers,</p>
              <p className={s.signoffTeam}>The Protocol Labs team</p>
            </div>
            <div className={s.footerDivider}>
              <span className={s.dividerLine} />
            </div>
            <div className={s.legal}>
              <p>You received this email because you are a member of the Protocol Labs network.</p>
              {/* The email settings (LAB-3351): sign-in first, so a forwarded page can't change the sender's. Their own
                  utm_source tells these clicks from the email's. */}
              <nav className={s.legalLinks}>
                <a href={emailSettingsHref('manage')}>Manage preferences</a>
                <a href={emailSettingsHref('unsubscribe')}>Unsubscribe</a>
              </nav>
            </div>
          </footer>
        </article>

        {/* 1100px and up: the side cards as a sticky column on the right. */}
        <aside className={s.rail}>
          <DigestSidebar variant="rail" topics={topicsCard} personalize={personalize} issues={issuesCard} />
        </aside>
      </div>

      {prompt && (
        <DigestSignInPrompt
          ask={prompt.ask}
          onSignIn={() => answerPrompt('sign-in')}
          onClose={() => answerPrompt('close')}
        />
      )}

      {topicsOpen && signedIn && topics.canSave && (
        <DigestTopicsModal
          followed={topics.followed}
          canSave={topics.canSave}
          onClose={() => setTopicsOpen(false)}
          onSave={(next) => topics.save(next, 'modal')}
        />
      )}
    </div>
  );
}
