'use client';

import { type ReactNode, useState } from 'react';
import { clsx } from 'clsx';
import { FormProvider, useForm } from 'react-hook-form';

// Production's new-post page: the route shell, the composer's styles and its form parts.
import pageCss from '@/app/forum/posts/new/page.module.scss';
import postCss from '@/components/page/forum/CreatePost/CreatePost.module.scss';
import { PostFormEditorLabel } from '@/components/page/forum/CreatePost/components/PostFormEditorLabel';
import { FormEditor } from '@/components/form/FormEditor';
import { FormField } from '@/components/form/FormField';
import { FormSelect } from '@/components/form/FormSelect';

// Sibling prototypes that already recreate the other two hosts with mock data.
import { AiSearchPage } from '../ai-search-page/AiSearchPage';
import { withTitle } from '../ai-search-page/mocks';
import { type ChatThread, newThreadId, seedThreads } from '../ai-mode/threads';
import { makeTurn } from '../ai-search/AnswerPanel';
import { FeedbackPage } from '../ai-apps-feedback-comments/FeedbackPage';
import { mockFeedbackRows } from '../ai-apps-feedback-comments/feedbackMocks';
import aiAppsProto from '../ai-apps-feedback-comments/AiAppsPrototype.module.scss';

import s from './McpSectionMock.module.scss';

/** What the member just asked, typed or received in each host. */
export const SEARCH_QUESTION = 'Open roles at Prime Intellect';
export const POST_TITLE = 'Who is hiring Rust engineers for zk work?';

/**
 * AI Search, as the ai-search-page prototype draws it: history rail, the
 * thread, the composer. The hint sits right above the follow-up field
 * (AnswerPanel's `aboveInput` slot).
 */
export function SearchHost({ hint }: { hint: ReactNode }) {
  const [threads, setThreads] = useState<ChatThread[]>(() => {
    const current: ChatThread = {
      id: newThreadId(),
      createdAt: new Date(),
      scope: null,
      title: SEARCH_QUESTION,
      turns: [makeTurn(SEARCH_QUESTION)],
    };
    return [current, ...seedThreads().map(withTitle)];
  });
  const [activeId, setActiveId] = useState<number | null>(threads[0].id);

  return (
    // Wrapped only to restyle production's Follow up questions title here (grey, closer to the list).
    <div className={s.searchHost}>
      <AiSearchPage
        signedIn
        threads={threads}
        onThreadsChange={setThreads}
        activeId={activeId}
        onActiveIdChange={setActiveId}
        shared={null}
        onSharedChange={() => {}}
        onSignIn={() => {}}
        onSignUp={() => {}}
        aboveInput={<div className={s.hostHintAboveInput}>{hint}</div>}
      />
    </div>
  );
}

const TOPICS = [
  { label: 'Hiring', value: 'hiring', description: 'Roles, candidates and referrals' },
  { label: 'Engineering', value: 'engineering', description: 'Protocols, infra and tooling' },
  { label: 'Fundraising', value: 'fundraising', description: 'Investors, rounds and terms' },
  { label: 'General', value: 'general', description: 'Anything else for the network' },
];

/**
 * Forum → New post, transcribed from production's CreatePost (its react-query,
 * store and analytics hooks dropped) on production's own styles and form
 * parts. The member has picked a topic and typed a title; the hint sits
 * between the title and the body, where the writing starts.
 */
export function ForumPostHost({ hint }: { hint: ReactNode }) {
  const methods = useForm({
    defaultValues: { topic: TOPICS[0], title: POST_TITLE, content: '' },
  });

  return (
    <div className={pageCss.root}>
      <div className={postCss.root}>
        <FormProvider {...methods}>
          <form className={postCss.modalContent} noValidate onSubmit={(e) => e.preventDefault()}>
            <div className={postCss.headerWrapper}>
              <div className={postCss.logo}>Create Post</div>
              <div className={postCss.controls}>
                <button type="button" className={postCss.cancelBtn}>
                  Cancel
                </button>
                <button className={postCss.submitBtn}>Post</button>
              </div>
            </div>
            <div className={postCss.header}>
              <button type="button" className={postCss.cancelBtn}>
                Cancel
              </button>
              <button className={postCss.submitBtn}>Post</button>
            </div>

            <p className={postCss.subtitle}>
              Only verified founders and operators in the PL network can see Forum posts.
            </p>

            <div className={clsx(postCss.content)}>
              <FormSelect name="topic" placeholder="Select topic" label="Select topic" options={TOPICS} />
              <FormField name="title" placeholder="Enter the title" label="Title" max={255} />
              <div className={s.hostHint}>{hint}</div>
              <FormEditor
                name="content"
                placeholder="Write your post here. Use @ to mention someone."
                label={<PostFormEditorLabel />}
                className={postCss.editor}
                classes={{ label: postCss.postLabel }}
                enableMentions={false}
              />
            </div>
          </form>
        </FormProvider>
      </div>
    </div>
  );
}

/** The new feedback waiting on the member's app, which the hint quotes. */
export const NEW_FEEDBACK = mockFeedbackRows.filter((row) => row.status === 'NEW');

/**
 * AI Apps → Feedback, Received tab, as the ai-apps-feedback-comments prototype
 * draws it on production's FeedbackTable. The hint sits under the tabs row
 * (FeedbackPage's `notice` slot), above the new rows it is about.
 */
export function FeedbackHost({ hint }: { hint: ReactNode }) {
  const [rows, setRows] = useState(mockFeedbackRows);
  return (
    <div className={aiAppsProto.shell}>
      <FeedbackPage
        view="received"
        received={rows}
        mine={[]}
        canReview
        onViewChange={() => {}}
        onStatusChange={(row, status) => setRows((prev) => prev.map((r) => (r.uid === row.uid ? { ...r, status } : r)))}
        notice={<div className={s.hostHintWide}>{hint}</div>}
      />
    </div>
  );
}
