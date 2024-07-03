import { IAnalyticsMemberInfo, IMember } from '@/types/members.types';
import { IAnalyticsProjectInfo } from '@/types/project.types';
import { IAnalyticsTeamInfo, IAnalyticsUserInfo } from '@/types/shared.types';
import { MEMBER_ANALYTICS_EVENTS } from '@/utils/constants';
import { usePostHog } from 'posthog-js/react';

export const useMemberAnalytics = () => {
  const postHogProps = usePostHog();

  const captureEvent = (eventName: string, eventParams = {}) => {
    try {
      if (postHogProps?.capture) {
        const allParams = { ...eventParams };
        postHogProps.capture(eventName, { ...allParams });
      }
    } catch (e) {
      console.error(e);
    }
  };

  function onOfficeHourClicked(user: IAnalyticsUserInfo | null, member: IAnalyticsMemberInfo | null) {
    const params = {
      user,
      member,
    };
    captureEvent(MEMBER_ANALYTICS_EVENTS.MEMBER_DETAIL_OFFICEHOURS_CLICKED, params);
  }

  function onProjectContributionEditClicked(member: IMember) {
    const params = {
      member,
    };
    captureEvent(MEMBER_ANALYTICS_EVENTS.MEMBER_DETAIL_PROJECT_CONTRIBUTIONS_EDIT, params);
  }

  function onProjectContributionAddlicked(member: IMember) {
    const params = {
      member,
    };
    captureEvent(MEMBER_ANALYTICS_EVENTS.MEMBER_DETAIL_PROJECT_CONTRIBUTIONS_ADD, params);
  }

  function onGithubSeeAllClicked(member: any, user: IAnalyticsUserInfo | null) {
    const params = {
      member,
      user,
    };

    captureEvent(MEMBER_ANALYTICS_EVENTS.MEMBER_DETAIL_GITHUB_PROJECT_VIEW_ALL_CLICKED, params);
  }

  function onGithubProjectItemClicked(member: any, user: IAnalyticsUserInfo | null) {
    const params = {
      member,
      user,
    };
    captureEvent(MEMBER_ANALYTICS_EVENTS.MEMBER_DETAIL_GITHUB_PROJECT_ITEM_CLICKED, params);
  }

  function onEditProfileClicked(user: IAnalyticsUserInfo | null, member: IAnalyticsMemberInfo | null) {
    const params = {
      user,
      member,
    };

    captureEvent(MEMBER_ANALYTICS_EVENTS.MEMBER_DETAIL_EDIT_PROFILE_CLICKED, params);
  }

  function onSocialProfileLinkClicked(user: IAnalyticsUserInfo | null, member: IAnalyticsMemberInfo | null, type: string, link: string) {
    const params = {
      user,
      member,
      type,
      link,
    };
    captureEvent(MEMBER_ANALYTICS_EVENTS.MEMBER_DETAIL_SOCIAL_LINK_CLICKED, params);
  }

  function onLearnMoreClicked(user: IAnalyticsUserInfo | null, member:IAnalyticsMemberInfo | null) {
    const params = {
      user,
      member
    };

    captureEvent(MEMBER_ANALYTICS_EVENTS.MEMBER_DETAIL_LEARN_MORE_BTN_CLICKED, params);
  }

  function onTeamsSeeAllClicked(user: IAnalyticsUserInfo | null, member: IAnalyticsMemberInfo | null) {
    const params = {
      user,
      member,
    };
    captureEvent(MEMBER_ANALYTICS_EVENTS.MEMBER_DETAIL_TEAMS_SEE_ALL_CLICKED, params);
  }

  function onTeamClicked(user: IAnalyticsUserInfo | null, member: IAnalyticsMemberInfo | null, team: IAnalyticsTeamInfo | null) {
    const params = {
      user,
      member,
      team,
    };
    captureEvent(MEMBER_ANALYTICS_EVENTS.MEMBER_DETAIL_TEAM_CLICKED, params);
  }

  function onSeeAllProjectContributionsClicked(user: IAnalyticsUserInfo | null, member: IAnalyticsMemberInfo | null) {
    const params = {
      user,
      member,
    };
    captureEvent(MEMBER_ANALYTICS_EVENTS.MEMBER_DETAIL_PROJECT_CONTRIBUTIONS_SEE_ALL_CLICKED, params);
  }

  function onProjectClicked(user: IAnalyticsUserInfo | null, member: IAnalyticsMemberInfo | null, project: IAnalyticsProjectInfo | null) {
    const params = {
      user,
      member,
      project,
    };
    captureEvent(MEMBER_ANALYTICS_EVENTS.MEMBER_DETAIL_PROJECT_CLICKED, params);
  }

  function onUpdateGitHubHandle(user: IAnalyticsUserInfo | null, member: IAnalyticsMemberInfo | null) {
    const params = {
      user,
      member,
    };
    captureEvent(MEMBER_ANALYTICS_EVENTS.MEMBER_DETAIL_GITHUB_HANDLE_UPDATE_CLICKED, params);
  }

  return {
    onOfficeHourClicked,
    onProjectContributionEditClicked,
    onProjectContributionAddlicked,
    onGithubSeeAllClicked,
    onGithubProjectItemClicked,
    onEditProfileClicked,
    onSocialProfileLinkClicked,
    onLearnMoreClicked,
    onTeamsSeeAllClicked,
    onTeamClicked,
    onSeeAllProjectContributionsClicked,
    onProjectClicked,
    onUpdateGitHubHandle,
  };
};
