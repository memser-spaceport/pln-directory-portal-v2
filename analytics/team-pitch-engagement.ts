import { useMemo } from 'react';
import { useDemoDayAnalytics } from '@/analytics/demoday.analytics';
import { useTeamPitchAnalytics } from '@/analytics/team-pitch.analytics';
import { DEMO_DAY_ANALYTICS, TEAM_PITCH_ANALYTICS } from '@/utils/constants';
import type { TrackEventDto } from '@/services/demo-day/hooks/useReportAnalyticsEvent';

type UserInfo = {
  uid?: string;
  email?: string;
  name?: string;
};

export function buildEngagementTrackEvent(
  eventName: string,
  distinctId: string,
  path: string,
  pitchSlug: string | undefined,
  properties: Record<string, unknown> = {},
): TrackEventDto {
  return {
    name: eventName,
    distinctId,
    properties: {
      path,
      timestamp: new Date().toISOString(),
      ...(pitchSlug ? { pitchSlug } : {}),
      ...properties,
    },
  };
}

export function useTeamEngagementAnalytics(pitchSlug?: string) {
  const demoDay = useDemoDayAnalytics();
  const teamPitch = useTeamPitchAnalytics();
  const isPitch = !!pitchSlug;
  const path = isPitch ? `/pitch/${pitchSlug}` : '/demoday';

  const capture = useMemo(
    () => ({
      teamCardViewed: (params: Record<string, unknown> = {}) =>
        isPitch ? teamPitch.onTeamCardViewed(params) : demoDay.onActiveViewTeamCardViewed(params),
      teamCardClicked: (params: Record<string, unknown> = {}) =>
        isPitch ? teamPitch.onTeamCardClicked(params) : demoDay.onActiveViewTeamCardClicked(params),
      deckViewed: (params: Record<string, unknown> = {}) =>
        isPitch ? teamPitch.onDeckViewed(params) : demoDay.onActiveViewTeamPitchDeckViewed(params),
      videoViewed: (params: Record<string, unknown> = {}) =>
        isPitch ? teamPitch.onVideoViewed(params) : demoDay.onActiveViewTeamPitchVideoViewed(params),
      videoWatchTime: (params: Record<string, unknown> = {}) =>
        isPitch ? teamPitch.onVideoWatchTime(params) : demoDay.onActiveViewVideoWatchTime(params),
      connectClicked: (params: Record<string, unknown> = {}) =>
        isPitch ? teamPitch.onConnectClicked(params) : demoDay.onActiveViewConnectCompanyClicked(params),
      investClicked: (params: Record<string, unknown> = {}) =>
        isPitch ? teamPitch.onInvestClicked(params) : demoDay.onActiveViewInvestCompanyClicked(params),
      introClicked: (params: Record<string, unknown> = {}) =>
        isPitch ? teamPitch.onIntroClicked(params) : demoDay.onActiveViewIntroCompanyClicked(params),
      introCancelClicked: (params: Record<string, unknown> = {}) =>
        isPitch ? teamPitch.onIntroCancelClicked(params) : demoDay.onActiveViewIntroCompanyCancelClicked(params),
      introConfirmClicked: (params: Record<string, unknown> = {}) =>
        isPitch ? teamPitch.onIntroConfirmClicked(params) : demoDay.onActiveViewIntroCompanyConfirmClicked(params),
      giveFeedbackClicked: (params: Record<string, unknown> = {}) =>
        isPitch ? teamPitch.onGiveFeedbackClicked(params) : demoDay.onActiveViewGiveFeedbackClicked(params),
      feedbackSubmitted: (params: Record<string, unknown> = {}) =>
        isPitch ? teamPitch.onFeedbackSubmitted(params) : demoDay.onActiveViewFeedbackSubmitted(params),
      likeCompanyClicked: (params: Record<string, unknown> = {}) => demoDay.onActiveViewLikeCompanyClicked(params),
    }),
    [isPitch, demoDay, teamPitch],
  );

  const events = useMemo(
    () => ({
      teamCardViewed: isPitch
        ? TEAM_PITCH_ANALYTICS.ON_TEAM_CARD_VIEWED
        : DEMO_DAY_ANALYTICS.ON_ACTIVE_VIEW_TEAM_CARD_VIEWED,
      teamCardClicked: isPitch
        ? TEAM_PITCH_ANALYTICS.ON_TEAM_CARD_CLICKED
        : DEMO_DAY_ANALYTICS.ON_ACTIVE_VIEW_TEAM_CARD_CLICKED,
      deckViewed: isPitch
        ? TEAM_PITCH_ANALYTICS.ON_DECK_VIEWED
        : DEMO_DAY_ANALYTICS.ON_ACTIVE_VIEW_TEAM_PITCH_DECK_VIEWED,
      videoViewed: isPitch
        ? TEAM_PITCH_ANALYTICS.ON_VIDEO_VIEWED
        : DEMO_DAY_ANALYTICS.ON_ACTIVE_VIEW_TEAM_PITCH_VIDEO_VIEWED,
      videoWatchTime: isPitch
        ? TEAM_PITCH_ANALYTICS.ON_VIDEO_WATCH_TIME
        : DEMO_DAY_ANALYTICS.ON_ACTIVE_VIEW_TEAM_PITCH_VIDEO_WATCH_TIME,
      connectClicked: isPitch
        ? TEAM_PITCH_ANALYTICS.ON_CONNECT_CLICKED
        : DEMO_DAY_ANALYTICS.ON_ACTIVE_VIEW_CONNECT_COMPANY_CLICKED,
      investClicked: isPitch
        ? TEAM_PITCH_ANALYTICS.ON_INVEST_CLICKED
        : DEMO_DAY_ANALYTICS.ON_ACTIVE_VIEW_INVEST_COMPANY_CLICKED,
      introClicked: isPitch
        ? TEAM_PITCH_ANALYTICS.ON_INTRO_CLICKED
        : DEMO_DAY_ANALYTICS.ON_ACTIVE_VIEW_INTRO_COMPANY_CLICKED,
      introCancelClicked: isPitch
        ? TEAM_PITCH_ANALYTICS.ON_INTRO_CANCEL_CLICKED
        : DEMO_DAY_ANALYTICS.ON_ACTIVE_VIEW_INTRO_COMPANY_CANCEL_CLICKED,
      introConfirmClicked: isPitch
        ? TEAM_PITCH_ANALYTICS.ON_INTRO_CONFIRM_CLICKED
        : DEMO_DAY_ANALYTICS.ON_ACTIVE_VIEW_INTRO_COMPANY_CONFIRM_CLICKED,
      giveFeedbackClicked: isPitch
        ? TEAM_PITCH_ANALYTICS.ON_GIVE_FEEDBACK_CLICKED
        : DEMO_DAY_ANALYTICS.ON_ACTIVE_VIEW_GIVE_FEEDBACK_CLICKED,
      feedbackSubmitted: isPitch
        ? TEAM_PITCH_ANALYTICS.ON_FEEDBACK_SUBMITTED
        : DEMO_DAY_ANALYTICS.ON_ACTIVE_VIEW_FEEDBACK_SUBMITTED,
      likeCompanyClicked: DEMO_DAY_ANALYTICS.ON_ACTIVE_VIEW_LIKE_COMPANY_CLICKED,
    }),
    [isPitch],
  );

  const trackEngagement = (
    eventKey: keyof typeof events,
    userInfo: UserInfo,
    properties: Record<string, unknown> = {},
  ): TrackEventDto | null => {
    if (!userInfo.email) return null;
    return buildEngagementTrackEvent(events[eventKey], userInfo.email, path, pitchSlug, {
      userId: userInfo.uid,
      userEmail: userInfo.email,
      userName: userInfo.name,
      ...properties,
    });
  };

  return { isPitch, path, pitchSlug, capture, events, trackEngagement };
}

export function useFounderProfileAnalytics(pitchSlug?: string) {
  const demoDay = useDemoDayAnalytics();
  const teamPitch = useTeamPitchAnalytics();
  const isPitch = !!pitchSlug;
  const path = isPitch ? `/pitch/${pitchSlug}` : '/demoday';

  const capture = useMemo(
    () => ({
      editProfileClicked: () =>
        isPitch ? teamPitch.onEditProfileClicked() : demoDay.onFounderEditTeamProfileButtonClicked(),
      saveProfileClicked: () =>
        isPitch ? teamPitch.onSaveProfileClicked() : demoDay.onFounderSaveTeamDetailsClicked(),
      cancelProfileClicked: () =>
        isPitch ? teamPitch.onCancelProfileClicked() : demoDay.onFounderCancelTeamDetailsClicked(),
      materialUploadStarted: (params: Record<string, unknown> = {}) =>
        isPitch ? teamPitch.onMaterialUploadStarted(params) : demoDay.onFounderDemoMaterialUploadStarted(params),
      materialUploadSuccess: (params: Record<string, unknown> = {}) =>
        isPitch ? teamPitch.onMaterialUploadSuccess(params) : demoDay.onFounderDemoMaterialUploadSuccess(params),
      materialUploadFailed: (params: Record<string, unknown> = {}) =>
        isPitch ? teamPitch.onMaterialUploadFailed(params) : demoDay.onFounderDemoMaterialUploadFailed(params),
      materialDeleted: (params: Record<string, unknown> = {}) =>
        isPitch ? teamPitch.onMaterialDeleted(params) : demoDay.onFounderDemoMaterialDeleted(params),
      materialViewed: (params: Record<string, unknown> = {}) =>
        isPitch ? teamPitch.onMaterialViewed(params) : demoDay.onFounderDemoMaterialViewed(params),
      profileReady: (params: Record<string, unknown> = {}) => {
        if (isPitch) teamPitch.onProfileReady(params);
      },
    }),
    [isPitch, demoDay, teamPitch],
  );

  const events = useMemo(
    () => ({
      editProfileClicked: isPitch
        ? TEAM_PITCH_ANALYTICS.ON_EDIT_PROFILE_CLICKED
        : DEMO_DAY_ANALYTICS.ON_FOUNDER_EDIT_TEAM_PROFILE_BUTTON_CLICKED,
      saveProfileClicked: isPitch
        ? TEAM_PITCH_ANALYTICS.ON_SAVE_PROFILE_CLICKED
        : DEMO_DAY_ANALYTICS.ON_FOUNDER_SAVE_TEAM_DETAILS_CLICKED,
      cancelProfileClicked: isPitch
        ? TEAM_PITCH_ANALYTICS.ON_CANCEL_PROFILE_CLICKED
        : DEMO_DAY_ANALYTICS.ON_FOUNDER_CANCEL_TEAM_DETAILS_CLICKED,
      materialUploadStarted: isPitch
        ? TEAM_PITCH_ANALYTICS.ON_MATERIAL_UPLOAD_STARTED
        : DEMO_DAY_ANALYTICS.ON_FOUNDER_DEMO_MATERIAL_UPLOAD_STARTED,
      materialUploadSuccess: isPitch
        ? TEAM_PITCH_ANALYTICS.ON_MATERIAL_UPLOAD_SUCCESS
        : DEMO_DAY_ANALYTICS.ON_FOUNDER_DEMO_MATERIAL_UPLOAD_SUCCESS,
      materialUploadFailed: isPitch
        ? TEAM_PITCH_ANALYTICS.ON_MATERIAL_UPLOAD_FAILED
        : DEMO_DAY_ANALYTICS.ON_FOUNDER_DEMO_MATERIAL_UPLOAD_FAILED,
      materialDeleted: isPitch
        ? TEAM_PITCH_ANALYTICS.ON_MATERIAL_DELETED
        : DEMO_DAY_ANALYTICS.ON_FOUNDER_DEMO_MATERIAL_DELETED,
      materialViewed: isPitch
        ? TEAM_PITCH_ANALYTICS.ON_MATERIAL_VIEWED
        : DEMO_DAY_ANALYTICS.ON_FOUNDER_DEMO_MATERIAL_VIEWED,
      profileReady: isPitch ? TEAM_PITCH_ANALYTICS.ON_PROFILE_READY : DEMO_DAY_ANALYTICS.ON_TEAM_PROFILE_READY,
    }),
    [isPitch],
  );

  const trackFounder = (
    eventKey: keyof typeof events,
    userInfo: UserInfo,
    properties: Record<string, unknown> = {},
  ): TrackEventDto | null => {
    if (!userInfo.email) return null;
    return buildEngagementTrackEvent(events[eventKey], userInfo.email, path, pitchSlug, {
      userId: userInfo.uid,
      userEmail: userInfo.email,
      userName: userInfo.name,
      ...properties,
    });
  };

  return { isPitch, path, pitchSlug, capture, events, trackFounder };
}
