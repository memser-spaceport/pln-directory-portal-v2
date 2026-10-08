'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { usePostHog } from 'posthog-js/react';
import { authEvents, useLoginRedirect } from '@/components/core/login/utils';
import { broadcastLogout } from '@/components/core/login/components/BroadcastChannel';
import { toast } from '@/components/core/ToastContainer';
import { EditInvestorProfileDrawer } from '@/components/page/demo-day/AppliedInvestorSteps/EditInvestorProfileDrawer/EditInvestorProfileDrawer';
import { FAQ } from '@/components/page/demo-day/InvestorPendingView/components/FAQ';
import {
  useSpvSpotlightAnalytics,
  type SpvContactUsSource,
  type SpvDataRoomSource,
  type SpvInvestorProfileSource,
  type SpvSignInSource,
  type SpvSpotlightBaseParams,
  type SpvSupportEmailSource,
  type SpvTeamWebsiteSource,
} from '@/analytics/spv-spotlight.analytics';
import { useCurrentUserStore } from '@/services/auth/store';
import { useContactSupportStore } from '@/services/contact-support/store';
import { useMember } from '@/services/members/hooks/useMember';
import { SHOW_EXPLORE_PL_NETWORK } from '@/services/explore-pl-network/constants';
import {
  getSpvSpotlightPath,
  REDIRECT_UNAUTHORIZED_SPV_SPOTLIGHT,
  REQUEST_FLOW_ENABLED,
} from '@/services/spv-spotlight/constants';
import { formatSpvClosesAt } from '@/services/spv-spotlight/formatSpvClosesAt';
import { useGetSpvSpotlight } from '@/services/spv-spotlight/hooks/useGetSpvSpotlight';
import { useRequestSpvAccess } from '@/services/spv-spotlight/hooks/useRequestSpvAccess';
import { isSpvLockedState, resolveSpvViewState, type SpvViewState } from '@/services/spv-spotlight/resolveSpvViewState';
import {
  SpvAccessRequestBlockedError,
  SpvAccessRequestValidationError,
  SpvSpotlightClosedError,
  type SpvAccessRequestPayload,
  type SpvSpotlight,
  type SpvViewerAccess,
} from '@/services/spv-spotlight/types';
import { checkInvestorProfileComplete } from '@/utils/member.utils';
import { clearAllAuthCookies } from '@/utils/third-party.helper';
import { TOAST_MESSAGES } from '@/utils/constants';
import { SpvTopBar } from './SpvTopBar/SpvTopBar';
import { SpvHero } from './SpvHero/SpvHero';
import { SpvLockedHero } from './SpvLockedHero/SpvLockedHero';
import { SpvInvestorProfileCard } from './SpvInvestorProfileCard/SpvInvestorProfileCard';
import { SpvCardAction, SpvCardStatus, SpvDataRoomNote, SpvTeamCard } from './SpvTeamCard/SpvTeamCard';
import { SpvDataRoomBand } from './SpvDataRoomBand/SpvDataRoomBand';
import { SpvExploreTile } from './SpvExploreTile/SpvExploreTile';
import { SpvFooter } from './SpvFooter/SpvFooter';
import { SpvRequestAccessModal, type SpvRequestAccessOutcome } from './SpvRequestAccessModal/SpvRequestAccessModal';
import { SpvRequestReceivedModal } from './SpvRequestReceivedModal/SpvRequestReceivedModal';
import { getSpvFaqItems, SPV_REQUEST_FLOW_FAQ_ITEMS } from './faq';
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
 * only renders it.
 *
 * Gated (the default, see REQUEST_FLOW_ENABLED): investors arrive signed in by
 * a token link, and only an approved viewer sees anything of the deal. Everyone
 * else gets a lock screen that names nothing about it. Until the page knows
 * which (auth hydrating, a login link still signing in, the viewer's own read in
 * flight) it shows an empty loading shell: no content to leak, and no lock to
 * flash at an invitee.
 *
 * Request flow: a signed-out visitor who has just requested access is shown as
 * pending for the rest of the visit, since the backend can't know who they are
 * until they sign in.
 */
export function SpvSpotlightView({ slug, initialSpotlight }: Props) {
  const { currentUser, isHydrated } = useCurrentUserStore();
  const isLoggedIn = !!currentUser?.uid;
  const goToLogin = useLoginRedirect();
  const analytics = useSpvSpotlightAnalytics();

  // Gated, a signed-out viewer is locked whatever the spotlight says, so the
  // page doesn't read what it would only hide.
  const { data, isError } = useGetSpvSpotlight(slug, { enabled: REQUEST_FLOW_ENABLED || isLoggedIn });
  // Request flow only (gated, the page passes none): the server's read (a prop,
  // never the shared query cache) stands in until the viewer's own read lands.
  // It is anonymous, so it only says where the viewer stands once we know
  // they're signed out: before the auth store hydrates, or for a signed-in
  // viewer, it is content only.
  const spotlight = data ?? initialSpotlight;
  const isProvisional = !data && (!isHydrated || isLoggedIn);
  // LoginTokenRedeemer signs the viewer in from the invitation link, then
  // reloads; until then they are signed out on paper only.
  const searchParams = useSearchParams();
  const redeemingLoginToken = !isLoggedIn && !!searchParams?.get('loginToken');
  const requestAccess = useRequestSpvAccess(slug, isLoggedIn);
  const { data: memberData } = useMember(isLoggedIn ? currentUser?.uid : undefined);
  const profileComplete = checkInvestorProfileComplete(memberData?.memberInfo, currentUser);
  // Set by the drawer's save (Demo Day, a past deal, or here); a profile the
  // request flow created alongside an access request has no type yet.
  const hasInvestorProfile = !!memberData?.memberInfo?.investorProfile?.type;
  const { openModal: openContactSupport } = useContactSupportStore((state) => state.actions);

  const postHog = usePostHog();

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
  const viewState: SpvViewState | null = (() => {
    if (!REQUEST_FLOW_ENABLED) {
      if (!isHydrated || redeemingLoginToken) return null;
      if (!isLoggedIn) return 'lockedSignedOut';
      return data ? resolveSpvViewState(data.status, data.viewerAccess, { signedIn: true, requestFlow: false }) : null;
    }
    // Null while provisional: the content shows, but nothing that depends on
    // where the viewer stands (no CTA to flash, no wrong message).
    return spotlight && access && !isProvisional
      ? resolveSpvViewState(spotlight.status, access, { signedIn: isLoggedIn, requestFlow: true })
      : null;
  })();
  const locked = isSpvLockedState(viewState);
  const router = useRouter();
  const redirectHome = REDIRECT_UNAUTHORIZED_SPV_SPOTLIGHT && locked;

  useEffect(() => {
    if (redirectHome) router.replace('/');
  }, [redirectHome, router]);

  const baseParams = (): SpvSpotlightBaseParams | null =>
    viewState ? { spotlight_slug: slug, spotlight_status: spotlight?.status ?? null, view_state: viewState } : null;

  // One page view per visit, once the viewer's state is known.
  const pageViewSent = useRef(false);
  useEffect(() => {
    const params = baseParams();
    if (pageViewSent.current || !params) return;
    pageViewSent.current = true;
    analytics.onPageViewed(params);
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
    if (params)
      analytics.onInvestorProfileClicked({
        ...params,
        source,
        profile_state: hasInvestorProfile ? 'review' : 'setup',
      });
    if (isLoggedIn) {
      setDrawerOpen(true);
    } else {
      signIn(source === 'success-sheet' ? 'success-sheet' : 'applied-steps', signedOutRequestEmail);
    }
  };

  const contactUs = (source: SpvContactUsSource) => {
    const params = baseParams();
    if (params) analytics.onContactUsClicked({ ...params, source });
    openContactSupport();
  };

  const websiteClicked = (source: SpvTeamWebsiteSource) => {
    const params = baseParams();
    if (params) analytics.onTeamWebsiteClicked({ ...params, source });
  };

  const supportEmailClicked = (source: SpvSupportEmailSource) => {
    const params = baseParams();
    if (params) analytics.onSupportEmailClicked({ ...params, source });
  };

  const dataRoomClicked = (source: SpvDataRoomSource) => {
    const params = baseParams();
    if (params) analytics.onOpenDataRoomClicked({ ...params, source });
  };

  // Production's AccountMenu logout; AuthBox (mounted on bare routes too) then
  // reloads the tab, so the page re-reads as signed out.
  const signOut = () => {
    clearAllAuthCookies();
    authEvents.emit('auth:logout');
    toast.success(TOAST_MESSAGES.LOGOUT_MSG);
    broadcastLogout();
    postHog.reset();
  };

  const topBar = (
    <SpvTopBar
      label={TOP_BAR_LABEL}
      account={
        isLoggedIn
          ? {
              name: currentUser?.name,
              profileImageUrl: currentUser?.profileImageUrl,
              onProfile: () => openProfile('top-bar'),
              onSignOut: signOut,
            }
          : null
      }
      // Hidden until auth hydrates, so a signed-in viewer never sees Sign in flash.
      onSignIn={isHydrated ? () => signIn('top-bar') : undefined}
    />
  );

  // For every viewer, locked ones included: someone who can't see the Spotlight
  // still needs somewhere to go.
  const exploreTile = SHOW_EXPLORE_PL_NETWORK && (
    <section className={s.section} aria-label="Explore the PL Network">
      <SpvExploreTile
        onClick={() => {
          const params = baseParams();
          if (params) analytics.onExploreTileClicked(params);
        }}
      />
    </section>
  );

  // The account menu's name item opens it on every state, locked ones included:
  // the profile is the investor's, not this Spotlight's.
  const drawer = isLoggedIn && currentUser?.uid && (
    <EditInvestorProfileDrawer
      isOpen={drawerOpen}
      onClose={() => setDrawerOpen(false)}
      uid={currentUser.uid}
      isLoggedIn
      isInvestor
      highlightUnfilled
      onSaved={() => {
        const params = baseParams();
        if (params) analytics.onInvestorProfileSaved(params);
      }}
    />
  );

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
      if (error instanceof SpvSpotlightClosedError) {
        // Closed while the form was open. The refetch (invalidated on settle)
        // turns the page into its closed state, which says so.
        setRequestOpen(false);
        return { type: 'success' };
      }
      if (params) analytics.onRequestAccessFailed(params);
      if (error instanceof SpvAccessRequestValidationError) {
        return { type: 'error', message: error.message };
      }
      return { type: 'error', message: 'Something went wrong. Please try again.' };
    }
  };

  if (locked && !redirectHome) {
    return (
      <div className={s.page}>
        {topBar}
        <div className={s.root}>
          <div className={s.content}>
            <SpvLockedHero
              variant={viewState}
              onSignIn={() => signIn('locked-hero')}
              onContactUs={() => contactUs(viewState === 'lockedSignedOut' ? 'locked-signed-out' : 'locked-no-access')}
            />
            {exploreTile}
            {/* No disclaimer and no support email: Contact us is the way to reach us. */}
            <SpvFooter note={<>© {new Date().getFullYear()} Protocol Labs.</>} />
          </div>
        </div>
        {drawer}
      </div>
    );
  }

  // Gated, nothing of the deal renders until the viewer's state is known.
  if (!spotlight || redirectHome || (!REQUEST_FLOW_ENABLED && !viewState)) {
    return (
      <div className={s.page}>
        {topBar}
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

  // The DocSend only reaches approved viewers of an open spotlight; without it
  // the card says the data room is being prepared and there's no band.
  const dataRoomUrl = viewState === 'open' ? spotlight.docSendUrl : null;
  const closesLabel = formatSpvClosesAt(spotlight.closesAt);

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
                  Already have an account?{' '}
                  <button type="button" className={s.inlineLink} onClick={() => signIn('card')}>
                    Sign in
                  </button>
                </>
              )
            }
          />
        );
      case 'open':
        // One label on every visit: without a DocSend integration the page can't
        // know whether the investor already asked for access or has it.
        return dataRoomUrl ? (
          <SpvCardAction
            label="Access data room"
            href={dataRoomUrl}
            onClick={() => dataRoomClicked('team-card')}
            note={<SpvDataRoomNote closesLabel={closesLabel} />}
          />
        ) : (
          <SpvCardStatus>Data room is being prepared</SpvCardStatus>
        );
      case 'pending':
        return <SpvCardStatus>Data room access pending review</SpvCardStatus>;
      case 'openingSoon':
        return <SpvCardStatus>Data room opens soon</SpvCardStatus>;
      case 'rejected':
        return <SpvCardStatus>Data room access not approved</SpvCardStatus>;
      case 'closed':
        return <SpvCardStatus>Data room closed</SpvCardStatus>;
    }
  })();

  return (
    <div className={s.page}>
      {/* No Contact us in the bar: the FAQ subtitle and the footer carry the support email. */}
      {topBar}

      <div className={s.root}>
        <div className={s.content}>
          <SpvHero
            viewState={viewState}
            title={spotlight.title}
            description={spotlight.description}
            isLoggedIn={isLoggedIn}
            profileComplete={profileComplete}
            onProfile={() => openProfile('applied-steps')}
            onContactUs={() => contactUs('rejected')}
          />

          {/* Waits for the member read, so a returning investor never sees the set-up ask flip to review. */}
          {(viewState === 'open' || viewState === 'openingSoon') && memberData && (
            <section className={s.section} aria-label="Your investor profile">
              <SpvInvestorProfileCard hasProfile={hasInvestorProfile} onOpen={() => openProfile('profile-card')} />
            </section>
          )}

          <section className={s.section} aria-label={`About ${spotlight.team.name}`}>
            <SpvTeamCard
              // Remount when pending flips, so the About's default open/closed applies.
              key={viewState === 'pending' ? 'about-open' : 'about-closed'}
              team={spotlight.team}
              media={spotlight.media}
              aboutOpen={viewState === 'pending'}
              action={cardAction}
              onFounderClicked={(memberUid) => {
                const params = baseParams();
                if (params) analytics.onFounderProfileClicked({ ...params, member_uid: memberUid });
              }}
              onWebsiteClicked={websiteClicked}
            />
          </section>

          {exploreTile}

          {dataRoomUrl && (
            <SpvDataRoomBand
              team={spotlight.team}
              docSendUrl={dataRoomUrl}
              closesLabel={closesLabel}
              onClick={() => dataRoomClicked('band')}
            />
          )}

          <section className={s.faqSection}>
            <FAQ
              title="Questions investors ask"
              items={
                REQUEST_FLOW_ENABLED
                  ? SPV_REQUEST_FLOW_FAQ_ITEMS
                  : getSpvFaqItems({
                      supportEmail: spotlight.supportEmail,
                      onSupportEmailClicked: () => supportEmailClicked('faq-answer'),
                    })
              }
              subtitle={
                <p className={s.faqSubtitle}>
                  Reach out to us at{' '}
                  <a
                    href={`mailto:${spotlight.supportEmail}`}
                    className={s.faqLink}
                    onClick={() => supportEmailClicked('faq')}
                  >
                    {spotlight.supportEmail}
                  </a>{' '}
                  for any other questions.
                </p>
              }
            />
          </section>

          <SpvFooter supportEmail={spotlight.supportEmail} onSupportEmailClicked={() => supportEmailClicked('footer')} />
        </div>
      </div>

      <SpvRequestAccessModal
        // Remount on sign-in/out so the locked email and name follow the session.
        key={currentUser?.uid ?? 'signed-out'}
        isOpen={requestOpen}
        onClose={() => setRequestOpen(false)}
        teamName={spotlight.team.name}
        prefill={isLoggedIn ? { email: currentUser?.email ?? '', name: currentUser?.name ?? '' } : null}
        onSubmit={handleRequestSubmit}
        onSignIn={(email) => signIn('already-requested-prompt', email)}
      />

      <SpvRequestReceivedModal
        isOpen={!!receivedEmail}
        email={receivedEmail ?? ''}
        isLoggedIn={isLoggedIn}
        profileComplete={profileComplete}
        onClose={() => setReceivedEmail(null)}
        onSetUpProfile={() => {
          setReceivedEmail(null);
          openProfile('success-sheet');
        }}
      />

      {drawer}
    </div>
  );
}
