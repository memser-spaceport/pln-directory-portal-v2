import { IAnalyticsMemberInfo } from '@/types/members.types';
import { IAnalyticsTeamInfo, IAnalyticsUserInfo, IAnalyticsFocusArea } from '@/types/shared.types';
import { usePostHog } from 'posthog-js/react';

export const useHomeAnalytics = () => {
  const postHogProps = usePostHog();

  const events = {
    husky_open_shared_blog: 'husky_open_shared_blog',
    husky_followup_ques_clicked: 'husky_followup_ques_clicked',
    husky_blog_url_copied: 'husky_blog_url_copied',
    husky_user_feedback_clicked: 'husky_user_feedback_clicked',
    husky_user_feedback_status: 'husky_user_feedback_status',
    husky_ai_response: 'husky_ai_response',
    husky_user_regenerate_clicked: 'husky_user_regenerate_clicked',
    husky_user_ques_edit_clicked: 'husky_user_ques_edit_clicked',
    husky_user_answer_copy_clicked: 'husky_user_answer_copy_clicked',
    husky_user_prompt: 'husky_user_prompt',
    husky_user_prompt_source_changed: 'husky_user_prompt_source_changed',
    husky_dialog_tab_clicked: 'husky_dialog_tab_clicked',
    husky_ask_prompt_type_selection: 'husky_ask_prompt_type_selection',
    husky_ask_prompt_clicked: 'husky_ask_prompt_clicked',
    husky_exploration_prompt_clicked: 'husky_exploration_prompt_clicked',
  };

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

  function trackSharedBlog(user: any, blogId: string) {
    captureEvent(events.husky_open_shared_blog, { ...(user && { ...user }), blogId });
  }

  function trackFollowupQuestionClick(user: any, mode: string, question: string, blogId?: string | null) {
    captureEvent(events.husky_followup_ques_clicked, { ...(user && { ...user }), ...(blogId && { blogId }), question, mode });
  }

  function trackCopyUrl(user: any, blogId: string) {
    captureEvent(events.husky_blog_url_copied, { ...(user && { ...user }), blogId });
  }

  function trackFeedbackClick(user: any, question: string, answer: string) {
    captureEvent(events.husky_user_feedback_clicked, { ...(user && { ...user }), question, answer });
  }

  function trackFeedbackStatus(user: any, status: string) {
    captureEvent(events.husky_user_feedback_status, { ...(user && { ...user }), status });
  }

  function trackAiResponse(user: any, status: string) {
    captureEvent(events.husky_ai_response, { ...(user && { ...user }), status });
  }

  function trackRegenerate(user: any) {
    captureEvent(events.husky_user_regenerate_clicked, { ...(user && { ...user }) });
  }

  return { trackSharedBlog, trackAiResponse, trackRegenerate, trackFollowupQuestionClick, trackCopyUrl, trackFeedbackClick, trackFeedbackStatus };
};
