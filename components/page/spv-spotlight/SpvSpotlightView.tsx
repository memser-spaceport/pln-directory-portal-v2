'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useLoginRedirect } from '@/components/core/login/utils';
import { EditInvestorProfileDrawer } from '@/components/page/demo-day/AppliedInvestorSteps/EditInvestorProfileDrawer/EditInvestorProfileDrawer';
import {
  useSpvSpotlightAnalytics,
  type SpvInvestorProfileSource,
  type SpvSignInSource,
  type SpvSpotlightBaseParams,
} from '@/analytics/spv-spotlight.analytics';
import { useCurrentUserStore } from '@/services/auth/store';
import { useMember } from '@/services/members/hooks/useMember';
import { SHOW_EXPLORE_PL_NETWORK } from '@/services/explore-pl-network/constants';
import { getSpvSpotlightPath } from '@/services/spv-spotlight/constants';
import { useGetSpvSpotlight } from '@/services/spv-spotlight/hooks/useGetSpvSpotlight';
import { useRequestSpvAccess } from '@/services/spv-spotlight/hooks/useRequestSpvAccess';
import { resolveSpvViewState, type SpvViewState } from '@/services/spv-spotlight/resolveSpvViewState';
import {
  SpvAccessRequestBlockedError,
  type SpvAccessRequestPayload,
  type SpvSpotlight,
  type SpvViewerAccess,
} from '@/services/spv-spotlight/types';
import { checkInvestorProfileComplete } from '@/utils/member.utils';
import { SpvTopBar } from './SpvTopBar/SpvTopBar';
import { SpvHero } from './SpvHero/SpvHero';
import { SpvCardAction, SpvCardStatus, SpvTeamCard } from './SpvTeamCard/SpvTeamCard';
import { SpvExploreTile } from './SpvExploreTile/SpvExploreTile';
import { SpvFooter } from './SpvFooter/SpvFooter';
import { SpvRequestAccessModal, type SpvRequestAccessOutcome } from './SpvRequestAccessModal/SpvRequestAccessModal';
import { SpvRequestReceivedModal } from './SpvRequestReceivedModal/SpvRequestReceivedModal';
import s from './SpvSpotlightView.module.scss';

const TOP_BAR_LABEL = 'PL Spotlight';

type Props = {
  slug: string;
  initialSpotlight: SpvSpotlight | null;
};

/**
 * Investor-facing SPV Spotlight: one SPV, one team. Chromeless (see
 * isBareRoute), unlisted, and built on the completed Demo Day template: hero →
 * team card → Explore PL Network tile → footer.
 *
 * Where the viewer stands comes from the backend (`viewerAccess`); this page
 * only renders it. The one local exception: a signed-out visitor who has just
 * requested access is shown as pending for the rest of the visit, since the
 * backend can't know who they are until they sign in.
 */
export function SpvSpotlightView({ slug, initialSpotlight }: Props) {
  const { currentUser } = useCurrentUserStore();
  const isLoggedIn = !!currentUser?.uid;
  const goToLogin = useLoginRedirect();
  const analytics = useSpvSpotlightAnalytics();

  const { data: spotlight, isError, isPlaceholderData } = useGetSpvSpotlight(slug, initialSpotlight);
  const requestAccess = useRequestSpvAccess(slug, isLoggedIn);
  const { data: memberData } = useMember(isLoggedIn ? currentUser?.uid : undefined);
  const profileComplete = checkInvestorProfileComplete(memberData?.memberInfo, currentUser);

  const [requestOpen, setRequestOpen] = useState(false);
  const [receivedEmail, setReceivedEmail] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  // Email of a request made while signed out during this visit.
  const [signedOutRequestEmail, setSignedOutRequestEmail] = useState<string | null>(null);

  const access: SpvViewerAccess | null = spotlight
    ? spotlight.viewerAccess === 'NONE' && signedOutRequestEmail
      ? 'PENDING'
      : spotlight.viewerAccess
    : null;
  // Null while a signed-in viewer's own read is loading: the content shows, but
  // nothing that depends on where they stand (no CTA to flash, no wrong message).
  const viewState: SpvViewState | null =
    spotlight && access && !isPlaceholderData ? resolveSpvViewState(spotlight.status, access) : null;

  const baseParams = (): SpvSpotlightBaseParams | null =>
    spotlight && viewState ? { spotlight_slug: slug, spotlight_status: spotlight.status, view_state: viewState } : null;

  // One page view per visit, once the viewer's state is known.
  const pageViewSent = useRef(false);
  useEffect(() => {
    if (pageViewSent.current || !spotlight || !viewState) return;
    pageViewSent.current = true;
    analytics.onPageViewed({ spotlight_slug: slug, spotlight_status: spotlight.status, view_state: viewState });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spotlight, viewState, slug]);

  const signIn = (source: SpvSignInSource, email?: string | null) => {
    const params = baseParams();
    if (params) analytics.onSignInClicked({ ...params, source });
    goToLogin({
      returnTo: getSpvSpotlightPath(slug),
      params: email ? { prefillEmail: email } : undefined,
    });
  };

  const openProfile = (source: SpvInvestorProfileSource) => {
    const params = baseParams();
    if (params) analytics.onInvestorProfileClicked({ ...params, source });
    if (isLoggedIn) {
      setDrawerOpen(true);
    } else {
      signIn(source === 'success-sheet' ? 'success-sheet' : 'applied-steps', signedOutRequestEmail);
    }
  };

  const handleRequestSubmit = async (payload: SpvAccessRequestPayload): Promise<SpvRequestAccessOutcome> => {
    const params = baseParams();
    try {
      const result = await requestAccess.mutateAsync(payload);
      if (params) analytics.onRequestAccessSubmitted({ ...params, is_new_member: result.isNewMember });
      if (!isLoggedIn) setSignedOutRequestEmail(payload.email);
      setRequestOpen(false);
      setReceivedEmail(payload.email);
      return { type: 'success' };
    } catch (error) {
      if (error instanceof SpvAccessRequestBlockedError) {
        if (params) analytics.onRequestAccessBlocked({ ...params, reason: error.reason });
        if (isLoggedIn) {
          // The backend already knows this viewer, so the refetched viewerAccess
          // (useRequestSpvAccess invalidates on settle) says where they stand.
          setRequestOpen(false);
          return { type: 'success' };
        }
        return { type: 'blocked' };
      }
      if (params) analytics.onRequestAccessFailed(params);
      return { type: 'error', message: 'Something went wrong. Please try again.' };
    }
  };

  if (!spotlight) {
    return (
      <div className={s.page}>
        <SpvTopBar label={TOP_BAR_LABEL} supportEmail={initialSpotlight?.supportEmail ?? 'spotlight@protocol.ai'} />
        <div className={s.root}>
          <div className={s.content}>
            {isError ? (
              <p className={s.stateMessage} role="alert">
                We couldn&apos;t load this Spotlight. Refresh the page to try again.
              </p>
            ) : (
              <div className={s.loading} aria-busy="true" aria-label="Loading Spotlight" />
            )}
          </div>
        </div>
      </div>
    );
  }

  const cardAction = (() => {
    switch (viewState) {
      case null:
        return undefined;
      case 'landing':
        return (
          <SpvCardAction
            label="Request access to data room"
            onClick={() => {
              const params = baseParams();
              if (params) analytics.onRequestAccessClicked(params);
              setRequestOpen(true);
            }}
            note={
              isLoggedIn ? undefined : (
                <>
                  Already requested access?{' '}
                  <button type="button" className={s.inlineLink} onClick={() => signIn('card')}>
                    Sign in
                  </button>
                </>
              )
            }
          />
        );
      case 'open':
        return spotlight.docSendUrl ? (
          <SpvCardAction
            label="View materials"
            href={spotlight.docSendUrl}
            onClick={() => {
              const params = baseParams();
              if (params) analytics.onViewMaterialsClicked(params);
            }}
          />
        ) : (
          <SpvCardStatus>Materials are being prepared</SpvCardStatus>
        );
      case 'pending':
        return <SpvCardStatus>Access requested, pending review</SpvCardStatus>;
      case 'openingSoon':
        return <SpvCardStatus>Approved, materials open soon</SpvCardStatus>;
      case 'rejected':
        return <SpvCardStatus>Access not approved</SpvCardStatus>;
      case 'closed':
        return <SpvCardStatus>Data room closed</SpvCardStatus>;
    }
  })();

  return (
    <div className={s.page}>
      <SpvTopBar label={TOP_BAR_LABEL} supportEmail={spotlight.supportEmail} />

      <div className={s.root}>
        <div className={s.content}>
          <SpvHero
            viewState={viewState}
            status={spotlight.status}
            title={spotlight.title}
            description={spotlight.description}
            supportEmail={spotlight.supportEmail}
            isLoggedIn={isLoggedIn}
            profileComplete={profileComplete}
            onProfile={openProfile}
          />

          <section className={s.section} aria-label={`About ${spotlight.team.name}`}>
            <SpvTeamCard
              // Remount when pending flips, so the About's default open/closed applies.
              key={viewState === 'pending' ? 'about-open' : 'about-closed'}
              team={spotlight.team}
              media={spotlight.media}
              aboutOpen={viewState === 'pending'}
              action={cardAction}
            />
          </section>

          {SHOW_EXPLORE_PL_NETWORK && (
            <section className={s.section} aria-label="Explore the PL Network">
              <SpvExploreTile
                onClick={() => {
                  const params = baseParams();
                  if (params) analytics.onExploreTileClicked(params);
                }}
              />
            </section>
          )}

          <SpvFooter supportEmail={spotlight.supportEmail} />
        </div>
      </div>

      <SpvRequestAccessModal
        // Remount on sign-in/out so the locked email and name follow the session.
        key={currentUser?.uid ?? 'signed-out'}
        isOpen={requestOpen}
        onClose={() => setRequestOpen(false)}
        spotlightTitle={spotlight.title}
        prefill={isLoggedIn ? { email: currentUser?.email ?? '', name: currentUser?.name ?? '' } : null}
        onSubmit={handleRequestSubmit}
        onSignIn={(email) => signIn('already-requested-prompt', email)}
      />

      <SpvRequestReceivedModal
        isOpen={!!receivedEmail}
        email={receivedEmail ?? ''}
        isLoggedIn={isLoggedIn}
        onClose={() => setReceivedEmail(null)}
        onSetUpProfile={() => {
          setReceivedEmail(null);
          openProfile('success-sheet');
        }}
      />

      {isLoggedIn && currentUser?.uid && (
        <EditInvestorProfileDrawer
          isOpen={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          uid={currentUser.uid}
          isLoggedIn
          isInvestor
        />
      )}
    </div>
  );
}
