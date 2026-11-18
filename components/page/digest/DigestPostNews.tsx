'use client';

import { useEffect, useRef, useState } from 'react';

import { useTeamNewsAnalytics } from '@/analytics/team-news.analytics';
import { toast } from '@/components/core/ToastContainer';
import { PostNewsModal } from '@/components/page/team-details/TeamNews/PostNewsModal';
import { useCurrentUserStore } from '@/services/auth/store';
import { useMember } from '@/services/members/hooks/useMember';
import { useCreateTeamNewsPost } from '@/services/team-news/hooks/useCreateTeamNewsPost';

import { DigestTeamNewsCard } from './DigestIssueEnd';

type Props = {
  /** Act on load: the email's "Post your team news →" lands with `?postnews=open`. */
  openOnLoad: boolean;
  /** Sign-in that comes back with `postnews=open`, so the post picks up where the reader left. */
  onSignIn: () => void;
};

export type DigestPostTeam = { uid: string; name: string };

/**
 * "Got news from your team?" with its Post news modal (LAB-3287; LAB-3313). Posting needs the signed-in member and
 * their team: a signed-out reader goes to sign-in first. One team opens the modal for it; more than one asks which
 * team first; a member on no team doesn't get the card. A `postnews=open` landing does what a press does, once the
 * member's teams have loaded.
 */
export function DigestPostNews({ openOnLoad, onSignIn }: Props) {
  const { currentUser, isHydrated } = useCurrentUserStore();
  const analytics = useTeamNewsAnalytics();
  const [requested, setRequested] = useState(openOnLoad);
  const [chosen, setChosen] = useState<DigestPostTeam | null>(null);
  const sectionRef = useRef<HTMLDivElement>(null);
  // The signed-in member's own record: UserInfoChecker reads the same query, so it is usually cached already.
  const memberQuery = useMember(currentUser?.uid);
  const teams = currentUser ? teamsOf(memberQuery.data) : null;
  const failed = Boolean(currentUser) && (memberQuery.isError || isErrorResult(memberQuery.data));
  const team = teams?.length === 1 ? teams[0] : chosen;
  const choosing = requested && !chosen && (teams?.length ?? 0) > 1;
  const createPost = useCreateTeamNewsPost(team?.uid ?? '');

  // The email link lands signed out: sign in first, then the address (still `?postnews=open`) acts again.
  useEffect(() => {
    if (openOnLoad && isHydrated && !currentUser) onSignIn();
  }, [openOnLoad, isHydrated, currentUser, onSignIn]);

  // Landed from the email with more than one team: the question is at the end of the page, so bring it into view.
  const scrolled = useRef(false);
  useEffect(() => {
    if (!choosing || !openOnLoad || scrolled.current) return;
    scrolled.current = true;
    sectionRef.current?.scrollIntoView({ block: 'center', behavior: 'instant' });
  }, [choosing, openOnLoad]);

  // Signed in, teams loaded, and none: nothing to post for.
  if (teams?.length === 0) return null;

  const onPost = () => {
    if (!isHydrated) return;
    if (!currentUser) return onSignIn();
    if (failed) void memberQuery.refetch();
    setChosen(null);
    setRequested(true);
  };

  const close = () => {
    setRequested(false);
    setChosen(null);
  };

  return (
    <div ref={sectionRef}>
      <DigestTeamNewsCard
        onPost={onPost}
        note={requested && failed ? 'Couldn’t load your teams. Try again.' : null}
        teams={choosing ? teams : null}
        onChooseTeam={setChosen}
      />
      {team && (
        <PostNewsModal
          open={requested && Boolean(currentUser)}
          onClose={close}
          teamUid={team.uid}
          teamName={team.name}
          existing={[]}
          isPublishing={createPost.isPending}
          onPublish={async (post) => {
            await createPost.mutateAsync({ title: post.title, body: post.body || undefined, url: post.url });
            analytics.onTeamNewsCreatePostSubmitted(team.uid, team.name, 'digest');
            toast.success('Posted. It’s on the network feed now.');
          }}
        />
      )}
    </div>
  );
}

type TeamRole = { teamUid?: string; teamTitle?: string; mainTeam?: unknown; team?: { uid?: string; name?: string } };

const isErrorResult = (data: unknown) => Boolean(data && typeof data === 'object' && 'isError' in data);

/**
 * The member's teams, main team first, from `useMember`'s record: `getMemberInfo` keeps the API's `teamMemberRoles`
 * and has no `teams` / `mainTeam` (those are the profile page's formatted member). `null` until the record is in.
 */
export function teamsOf(data: unknown): DigestPostTeam[] | null {
  const member = data && typeof data === 'object' && 'memberInfo' in data ? (data.memberInfo as unknown) : undefined;
  const roles = (member as { teamMemberRoles?: TeamRole[] } | undefined)?.teamMemberRoles;
  if (!Array.isArray(roles)) return null;
  const seen = new Set<string>();
  const teams: (DigestPostTeam & { main: boolean })[] = [];
  for (const role of roles) {
    const uid = (role?.team?.uid || role?.teamUid || '').trim();
    if (!uid || seen.has(uid)) continue;
    seen.add(uid);
    teams.push({ uid, name: (role.team?.name || role.teamTitle || '').trim(), main: Boolean(role.mainTeam) });
  }
  return teams.sort((a, b) => Number(b.main) - Number(a.main)).map(({ uid, name }) => ({ uid, name }));
}
