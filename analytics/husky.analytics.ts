import { IAnalyticsMemberInfo } from '@/types/members.types';
import { IAnalyticsTeamInfo, IAnalyticsUserInfo, IAnalyticsFocusArea } from '@/types/shared.types';
import { getUserInfo } from '@/utils/third-party.helper';
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
    husky_action_card_clicked: 'husky_action_card_clicked',
    husky_ask_upload_data_clicked: 'husky_ask_upload_data_clicked',
    husky_login_clicked: 'husky_login_clicked',
  };

  const captureEvent = (eventName: string, eventParams = {}) => {
    try {
      if (postHogProps?.capture) {
        const allParams = { ...eventParams };
        const userInfo = getUserInfo();
        const loggedInUserUid = userInfo?.uid;
        const loggedInUserEmail = userInfo?.email;
        const loggedInUserName = userInfo?.name;
        postHogProps.capture(eventName, { ...allParams, ...(loggedInUserEmail && {loggedInUserUid, loggedInUserEmail, loggedInUserName}) });
      }
    } catch (e) {
      console.error(e);
    }
  };

  function trackHuskyLogin() {
    captureEvent(events.husky_login_clicked)
  }

  function trackUploadData() {
    captureEvent(events.husky_ask_upload_data_clicked)
  }

  function trackHuskySourceLinkClicked(link: string) {
    captureEvent(events.husky_source_link_clicked, {link});
  }

  function trackHuskyActionCardClicked(action: any) {
    captureEvent(events.husky_action_card_clicked, {...action})
  }

  function trackSharedBlog(blogId: string, mode: string, question: string) {
    captureEvent(events.husky_open_shared_blog, {blogId, mode, question });
  }

  function trackFollowupQuestionClick(mode: string, question: string, blogId?: string | null) {
    captureEvent(events.husky_followup_ques_clicked, { ...(blogId && { blogId }), question, mode });
  }

  function trackCopyUrl(blogId: string) {
    captureEvent(events.husky_blog_url_copied, { blogId });
  }

  function trackFeedbackClick( question: string, answer: string) {
    captureEvent(events.husky_user_feedback_clicked, { question, answer });
  }

  function trackFeedbackStatus( status: string, rating: string, question: string) {
    captureEvent(events.husky_user_feedback_status, { feedbackStatus: status, rating, question });
  }

  function trackAiResponse(status: string, mode: string, isBlog: boolean, question: string) {
    captureEvent(events.husky_ai_response, { huskyResponse: status, mode, isBlog, question });
  }

  function trackRegenerate() {
    captureEvent(events.husky_user_regenerate_clicked);
  }

  function trackQuestionEdit(question: string) {
    captureEvent(events.husky_user_ques_edit_clicked, { question });
  }

  function trackAnswerCopy(answer: string) {
    captureEvent(events.husky_user_answer_copy_clicked, { answer });
  }

  function trackUserPrompt(query: string) {
    captureEvent(events.husky_user_prompt, { query });
  }

  function trackSourceChange(sourceSelected: string) {
    captureEvent(events.husky_user_prompt_source_changed, { sourceSelected });
  }

  function trackTabSelection( tabSelected: string) {
    captureEvent(events.husky_dialog_tab_clicked, { tabSelected });
  }

  function trackPromptTypeSelection(promptType: string) {
    captureEvent(events.husky_ask_prompt_type_selection, { promptType });
  }

  function trackPromptSelection(prompt: string) {
    captureEvent(events.husky_ask_prompt_clicked, {prompt });
  }

  function trackExplorationPromptSelection( prompt: string) {
    captureEvent(events.husky_exploration_prompt_clicked, { prompt })
  }

  return { trackSharedBlog, trackHuskyLogin, trackUploadData, trackHuskySourceLinkClicked, trackHuskyActionCardClicked, trackTabSelection, trackPromptSelection, trackExplorationPromptSelection, trackPromptTypeSelection, trackSourceChange, trackAnswerCopy, trackUserPrompt, trackQuestionEdit, trackAiResponse, trackRegenerate, trackFollowupQuestionClick, trackCopyUrl, trackFeedbackClick, trackFeedbackStatus };
};


