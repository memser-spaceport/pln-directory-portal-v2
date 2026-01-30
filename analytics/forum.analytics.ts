import { FORUM_ANALYTICS_EVENTS } from '@/utils/constants';
import { getUserInfo } from '@/utils/third-party.helper';
import { usePostHog } from 'posthog-js/react';
import { CreatePostMutationParams } from '@/services/forum/hooks/useCreatePost';
import { PostCommentMutationParams } from '@/services/forum/hooks/usePostComment';
import { EditPostMutationParams } from '@/services/forum/hooks/useEditPost';

// Utility function to convert milliseconds to hh:mm:ss format
function formatTimeSincePostCreation(milliseconds: number): string {
  const totalSeconds = Math.floor(milliseconds / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  // Pad with zeros to ensure two digits
  const paddedHours = hours.toString().padStart(2, '0');
  const paddedMinutes = minutes.toString().padStart(2, '0');
  const paddedSeconds = seconds.toString().padStart(2, '0');

  return `${paddedHours}:${paddedMinutes}:${paddedSeconds}`;
}

export const useForumAnalytics = () => {
  const postHogProps = usePostHog();

  const captureEvent = (eventName: string, eventParams = {}) => {
    try {
      if (postHogProps?.capture) {
        const allParams = { ...eventParams };
        const userInfo = getUserInfo();
        const loggedInUserUid = userInfo?.uid;
        const loggedInUserEmail = userInfo?.email;
        const loggedInUserName = userInfo?.name;
        postHogProps.capture(eventName, { ...allParams, loggedInUserUid, loggedInUserEmail, loggedInUserName });
      }
    } catch (e) {
      console.error(e);
    }
  };

  function onForumTopicClicked(params: { topicId?: string | number; topicName?: string }) {
    captureEvent(FORUM_ANALYTICS_EVENTS.TOPIC_CLICKED, params);
  }

  function onForumSortSelected(params: { sortBy?: string }) {
    captureEvent(FORUM_ANALYTICS_EVENTS.SORT_SELECTED, params);
  }

  function onCreatePostClicked() {
    captureEvent(FORUM_ANALYTICS_EVENTS.CREATE_POST_CLICKED, {});
  }

  function onCreatePostSubmit(params: CreatePostMutationParams) {
    captureEvent(FORUM_ANALYTICS_EVENTS.CREATE_POST_SUBMIT, params);
  }

  function onCreatePostCancel() {
    captureEvent(FORUM_ANALYTICS_EVENTS.CREATE_POST_CANCEL, {});
  }

  function onPostClicked(params: { tid?: string | number }) {
    captureEvent(FORUM_ANALYTICS_EVENTS.POST_CLICKED, params);
  }

  function onLikePostClicked(params: { tid?: string | number; pid?: string | number; timeSincePostCreation: number }) {
    const transformedParams = {
      ...params,
      timeSincePostCreation: formatTimeSincePostCreation(params.timeSincePostCreation),
    };
    captureEvent(FORUM_ANALYTICS_EVENTS.POST_LIKED, transformedParams);
  }

  function onCommentInputClicked(params: { tid?: string | number; timeSincePostCreation: number }) {
    const transformedParams = {
      ...params,
      timeSincePostCreation: formatTimeSincePostCreation(params.timeSincePostCreation),
    };
    captureEvent(FORUM_ANALYTICS_EVENTS.COMMENT_INPUT_CLICKED, transformedParams);
  }

  function onPostCommentSubmit(params: PostCommentMutationParams & { timeSincePostCreation: number }) {
    const transformedParams = {
      ...params,
      timeSincePostCreation: formatTimeSincePostCreation(params.timeSincePostCreation),
    };
    captureEvent(FORUM_ANALYTICS_EVENTS.POST_COMMENT_SUBMIT, transformedParams);
  }

  function onPostCommentCancel() {
    captureEvent(FORUM_ANALYTICS_EVENTS.POST_COMMENT_CANCEL, {});
  }

  function onPostCommentNotificationSettingsClicked(params: {
    tid?: string | number;
    toPid?: string | number;
    value: boolean;
  }) {
    captureEvent(FORUM_ANALYTICS_EVENTS.POST_COMMENT_NOTIFICATION_SETTINGS_CLICKED, params);
  }

  function onPostCommentReplyClicked(params: {
    tid?: string | number;
    pid?: string | number;
    timeSincePostCreation: number;
  }) {
    const transformedParams = {
      ...params,
      timeSincePostCreation: formatTimeSincePostCreation(params.timeSincePostCreation),
    };
    captureEvent(FORUM_ANALYTICS_EVENTS.POST_COMMENT_REPLY_CLICKED, transformedParams);
  }

  function onPostEditClicked(params: { tid?: string | number; pid?: string | number }) {
    captureEvent(FORUM_ANALYTICS_EVENTS.POST_EDIT_CLICKED, params);
  }

  function onEditPostSubmit(params: EditPostMutationParams) {
    captureEvent(FORUM_ANALYTICS_EVENTS.EDIT_POST_SUBMIT, params);
  }

  function onEditPostCancel() {
    captureEvent(FORUM_ANALYTICS_EVENTS.EDIT_POST_CANCEL, {});
  }

  function onDigestEmailPostLinkClicked(params: Record<string, string | null>) {
    captureEvent(FORUM_ANALYTICS_EVENTS.DIGEST_EMAIL_POST_CLICKED, params);
  }

  function onCommentNotificationEmailLinkClicked(params: Record<string, string | null>) {
    captureEvent(FORUM_ANALYTICS_EVENTS.COMMENT_NOTIFICATION_EMAIL_LINK_CLICKED, params);
  }

  function onCommentNotificationEmailReplyClicked(params: Record<string, string | null>) {
    captureEvent(FORUM_ANALYTICS_EVENTS.COMMENT_NOTIFICATION_EMAIL_REPLY_CLICKED, params);
  }

  function onMentionInitiated(params?: { context?: string }) {
    captureEvent(FORUM_ANALYTICS_EVENTS.MENTION_INITIATED, params || {});
  }

  function onMentionSearch(params: { query: string; resultsCount?: number; context?: string }) {
    captureEvent(FORUM_ANALYTICS_EVENTS.MENTION_SEARCH, params);
  }

  function onMentionSelected(params: { memberUid: string; memberName: string; query?: string; context?: string }) {
    captureEvent(FORUM_ANALYTICS_EVENTS.MENTION_SELECTED, params);
  }

  function onMemberProfileForumActivityTabClicked(params: {
    memberUid: string;
    memberName: string;
    tab: 'posts' | 'comments';
    previousTab?: 'posts' | 'comments';
    postsCount: number;
    commentsCount: number;
    location?: 'section' | 'modal';
  }) {
    captureEvent(FORUM_ANALYTICS_EVENTS.MEMBER_PROFILE_FORUM_ACTIVITY_TAB_CLICKED, params);
  }

  function onMemberProfileForumActivityShowAllClicked(params: {
    memberUid: string;
    memberName: string;
    activeTab: 'posts' | 'comments';
    postsCount: number;
    commentsCount: number;
  }) {
    captureEvent(FORUM_ANALYTICS_EVENTS.MEMBER_PROFILE_FORUM_ACTIVITY_SHOW_ALL_CLICKED, params);
  }

  function onMemberProfileForumActivityModalOpened(params: {
    memberUid: string;
    memberName: string;
    activeTab: 'posts' | 'comments';
    postsCount: number;
    commentsCount: number;
  }) {
    captureEvent(FORUM_ANALYTICS_EVENTS.MEMBER_PROFILE_FORUM_ACTIVITY_MODAL_OPENED, params);
  }

  function onMemberProfileForumActivityModalClosed(params: {
    memberUid: string;
    memberName: string;
    activeTab: 'posts' | 'comments';
  }) {
    captureEvent(FORUM_ANALYTICS_EVENTS.MEMBER_PROFILE_FORUM_ACTIVITY_MODAL_CLOSED, params);
  }

  function onMemberProfileForumActivityPostCardClicked(params: {
    memberUid: string;
    memberName: string;
    postId: string | number;
    postTitle?: string;
    postCategoryId?: string | number;
    location?: 'section' | 'modal';
    position?: number;
  }) {
    captureEvent(FORUM_ANALYTICS_EVENTS.MEMBER_PROFILE_FORUM_ACTIVITY_POST_CARD_CLICKED, params);
  }

  function onMemberProfileForumActivityCommentCardClicked(params: {
    memberUid: string;
    memberName: string;
    commentId: string | number;
    topicId?: string | number;
    topicTitle?: string;
    location?: 'section' | 'modal';
    position?: number;
  }) {
    captureEvent(FORUM_ANALYTICS_EVENTS.MEMBER_PROFILE_FORUM_ACTIVITY_COMMENT_CARD_CLICKED, params);
  }

  function onMemberProfileForumActivityStartDiscussionClicked(params: {
    memberUid: string;
    memberName: string;
    activeTab: 'posts' | 'comments';
  }) {
    captureEvent(FORUM_ANALYTICS_EVENTS.MEMBER_PROFILE_FORUM_ACTIVITY_START_DISCUSSION_CLICKED, params);
  }

  function onMemberProfileForumActivityBrowseDiscussionsClicked(params: {
    memberUid: string;
    memberName: string;
    activeTab: 'posts' | 'comments';
  }) {
    captureEvent(FORUM_ANALYTICS_EVENTS.MEMBER_PROFILE_FORUM_ACTIVITY_BROWSE_DISCUSSIONS_CLICKED, params);
  }

  function onMemberProfileForumActivitySignInClicked(params: {
    memberUid: string;
    memberName: string;
    activeTab: 'posts' | 'comments';
  }) {
    captureEvent(FORUM_ANALYTICS_EVENTS.MEMBER_PROFILE_FORUM_ACTIVITY_SIGN_IN_CLICKED, params);
  }

  function onMemberProfileForumActivitySignUpClicked(params: {
    memberUid: string;
    memberName: string;
    activeTab: 'posts' | 'comments';
  }) {
    captureEvent(FORUM_ANALYTICS_EVENTS.MEMBER_PROFILE_FORUM_ACTIVITY_SIGN_UP_CLICKED, params);
  }

  return {
    onForumTopicClicked,
    onForumSortSelected,
    onCreatePostClicked,
    onCreatePostSubmit,
    onCreatePostCancel,
    onPostClicked,
    onLikePostClicked,
    onCommentInputClicked,
    onPostCommentSubmit,
    onPostCommentCancel,
    onPostCommentNotificationSettingsClicked,
    onPostCommentReplyClicked,
    onPostEditClicked,
    onEditPostSubmit,
    onEditPostCancel,
    onDigestEmailPostLinkClicked,
    onCommentNotificationEmailLinkClicked,
    onCommentNotificationEmailReplyClicked,
    onMentionInitiated,
    onMentionSearch,
    onMentionSelected,
    onMemberProfileForumActivityTabClicked,
    onMemberProfileForumActivityShowAllClicked,
    onMemberProfileForumActivityModalOpened,
    onMemberProfileForumActivityModalClosed,
    onMemberProfileForumActivityPostCardClicked,
    onMemberProfileForumActivityCommentCardClicked,
    onMemberProfileForumActivityStartDiscussionClicked,
    onMemberProfileForumActivityBrowseDiscussionsClicked,
    onMemberProfileForumActivitySignInClicked,
    onMemberProfileForumActivitySignUpClicked,
  };
};
