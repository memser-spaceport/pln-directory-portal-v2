import { IAnalyticsMemberInfo } from '@/types/members.types';
import { IAnalyticsTeamInfo, IAnalyticsUserInfo, IAnalyticsFocusArea } from '@/types/shared.types';
import { usePostHog } from 'posthog-js/react';

export const useHuskyAnalytics = () => {
  const postHogProps = usePostHog();

  const events = {
    husky_open_shared_blog: 'husky_open_shared_blog',
    husky_followup_ques_clicked: 'husky_followup_ques_clicked',
    husky_blog_url_copied: 'husky_blog_url_copied',
    husky_source_link_clicked: 'husky_source_link_clicked',
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
    husky_action_card_clicked: 'husky_action_card_clicked'
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

  function trackHuskySourceLinkClicked(link: string) {
    captureEvent(events.husky_source_link_clicked, {link});
  }

  function trackHuskyActionCardClicked(action: any) {
    captureEvent(events.husky_action_card_clicked, {...action})
  }

  function trackSharedBlog(user: any, blogId: string, mode: string) {
    captureEvent(events.husky_open_shared_blog, { ...(user && { ...user }), blogId, mode });
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

  function trackAiResponse(user: any, status: string, mode: string) {
    captureEvent(events.husky_ai_response, { ...(user && { ...user }), status, mode, });
  }

  function trackRegenerate(user: any) {
    captureEvent(events.husky_user_regenerate_clicked, { ...(user && { ...user }) });
  }

  function trackQuestionEdit(question: string) {
    captureEvent(events.husky_user_ques_edit_clicked, { question });
  }

  function trackAnswerCopy(user: any, answer: string) {
    captureEvent(events.husky_user_answer_copy_clicked, { ...(user && { ...user }), answer });
  }

  function trackUserPrompt(user: any, query: string) {
    captureEvent(events.husky_user_prompt, { ...(user && { ...user }), query });
  }

  function trackSourceChange(user: any, sourceSelected: string) {
    captureEvent(events.husky_user_prompt_source_changed, { ...(user && { ...user }), sourceSelected });
  }

  function trackTabSelection(user: any, tabSelected: string) {
    captureEvent(events.husky_dialog_tab_clicked, { ...(user && { ...user }), tabSelected });
  }

  function trackPromptTypeSelection(user: any, promptType: string) {
    captureEvent(events.husky_ask_prompt_type_selection, { ...(user && { ...user }), promptType });
  }

  function trackPromptSelection(user: any, prompt: string) {
    captureEvent(events.husky_ask_prompt_clicked, { ...(user && { ...user }), prompt });
  }

  function trackExplorationPromptSelection(user: any, prompt: string) {
    captureEvent(events.husky_exploration_prompt_clicked, { ...(user && { ...user }), prompt })
  }

  return { trackSharedBlog, trackHuskySourceLinkClicked, trackHuskyActionCardClicked, trackTabSelection, trackPromptSelection, trackExplorationPromptSelection, trackPromptTypeSelection, trackSourceChange, trackAnswerCopy, trackUserPrompt, trackQuestionEdit, trackAiResponse, trackRegenerate, trackFollowupQuestionClick, trackCopyUrl, trackFeedbackClick, trackFeedbackStatus };
};


