'use client';

import { type ReactNode, useState } from 'react';
import Image from 'next/image';
import { clsx } from 'clsx';
import { FormProvider, useForm } from 'react-hook-form';

// Production's header search dialog: its chrome styles and its results parts.
import dialogCss from '@/components/core/application-search/components/AppSearchDialog/AppSearchDialog.module.scss';
import { CollapsibleSection } from '@/components/core/application-search/components/CollapsableSection';
import { SearchCategories } from '@/components/core/application-search/components/SearchCategories';
import { SearchResultsSection } from '@/components/core/application-search/components/SearchResultsSection';
import { getGroupTitleByGroupName } from '@/components/core/application-search/components/SearchResultsSection/components/Top50Results/utils/getGroupTitleByGroupName';
import { ArrowUpRightIcon, CloseIcon } from '@/components/icons';
import type { FoundItem, SearchResult } from '@/services/search/types';

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
import { AddAiAppCard } from '@/components/page/ai-apps/AiAppsPage/components/AddAiAppCard';
import appsPage from '@/components/page/ai-apps/AiAppsPage/AiAppsPage.module.scss';
import appsGrid from '@/components/page/ai-apps/AiAppsPage/components/AiAppsGrid/AiAppsGrid.module.scss';
import { AiAppCard } from '../ai-apps/AiAppCard';
import { currentUser, mockAiApps, mockPageCopy } from '../ai-apps/mocks';
import aiAppsList from '../ai-apps/AiAppsPrototype.module.scss';

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

/** What the member typed into the header search. */
export const GENERAL_TERM = 'zk proofs';

const GENERAL_RESULTS: Record<'members' | 'teams' | 'projects', FoundItem[]> = {
  members: [
    {
      uid: 'mock-member-1',
      name: 'Maya Lindqvist',
      index: 'members',
      image: undefined,
      availableToConnect: true,
      matches: [{ field: 'skills', content: 'Rust, <em>zk proofs</em>, cryptography' }],
    },
    {
      uid: 'mock-member-2',
      name: 'Daniel Okafor',
      index: 'members',
      image: undefined,
      matches: [{ field: 'bio', content: 'Building recursive <em>zk proofs</em> for light clients' }],
    },
  ],
  teams: [
    {
      uid: 'mock-team-1',
      name: 'Lurk Lab',
      index: 'teams',
      image: undefined,
      matches: [{ field: 'shortDescription', content: 'A Turing-complete language for <em>zk proofs</em>' }],
    },
    {
      uid: 'mock-team-2',
      name: 'Filecoin Proofs',
      index: 'teams',
      image: undefined,
      matches: [{ field: 'tagline', content: '<em>zk proofs</em>, storage, SNARKs' }],
    },
  ],
  projects: [
    {
      uid: 'mock-project-1',
      name: 'Bellperson',
      index: 'projects',
      image: undefined,
      matches: [{ field: 'shortDescription', content: 'GPU-accelerated <em>zk proofs</em> for Groth16' }],
    },
  ],
};

const GENERAL_SECTIONS = ['members', 'teams', 'projects'] as const;

/**
 * The header search dialog (⌘K) in its results state, transcribed from
 * production's AppSearchDialog on its own styles, with production's result
 * rows, chips and sections fed mock hits. Drawn in place rather than in a
 * Modal, and without the query hook, Escape ladder or answer view. The hint
 * is a band under the results, above the shortcut footer: it does not
 * scroll, and it stays out of the way of the AI row pinned above the list.
 */
export function GeneralSearchHost({ hint }: { hint: ReactNode }) {
  const [activeCategory, setActiveCategory] = useState<keyof SearchResult | null>(null);
  const data = { top: [], forumThreads: [], events: [], ...GENERAL_RESULTS } as unknown as SearchResult;
  const total = GENERAL_SECTIONS.reduce((sum, key) => sum + GENERAL_RESULTS[key].length, 0);

  return (
    <div className={s.generalSearchHost}>
      <div className={dialogCss.card} role="dialog" aria-label="Search">
        <div className={dialogCss.header}>
          <div className={dialogCss.field}>
            <Image className={dialogCss.fieldGlyph} src="/icons/search-right.svg" alt="" width={20} height={20} />
            <input
              className={dialogCss.fieldInput}
              type="text"
              defaultValue={GENERAL_TERM}
              aria-label="Search or ask AI Search a question"
            />
          </div>
          <button type="button" className={dialogCss.close} aria-label="Close search">
            <CloseIcon />
          </button>
        </div>

        <div className={dialogCss.askBar}>
          <button type="button" className={dialogCss.askRow}>
            <Image className={dialogCss.askGlyph} src="/icons/ai-search.svg" alt="" width={20} height={20} />
            <span className={dialogCss.askText}>Chat with AI Search about &ldquo;{GENERAL_TERM}&rdquo;</span>
            <span className={dialogCss.askArrow}>
              <ArrowUpRightIcon />
            </span>
          </button>
        </div>

        <div className={dialogCss.body}>
          <div className={dialogCss.totalLabel}>Total results ({total})</div>
          <div className={dialogCss.sticky}>
            <SearchCategories data={data} activeCategory={activeCategory} setActiveCategory={setActiveCategory} />
          </div>
          <div className={dialogCss.sections}>
            {GENERAL_SECTIONS.map((key) => {
              if (activeCategory && key !== activeCategory) return null;
              const values = GENERAL_RESULTS[key];
              return (
                <CollapsibleSection
                  key={key}
                  title={`${getGroupTitleByGroupName(key)} (${values.length})`}
                  initialOpen
                  forceOpen
                  hideControl
                >
                  <SearchResultsSection items={values} query={GENERAL_TERM} />
                </CollapsibleSection>
              );
            })}
          </div>
        </div>

        <div className={s.hostHintBand}>{hint}</div>

        <div className={clsx(dialogCss.footer, s.generalSearchFooter)}>
          <span className={dialogCss.footerItem}>
            <kbd className={dialogCss.kbd}>⌘K</kbd> to open
          </span>
          <span className={dialogCss.footerItem}>
            <kbd className={dialogCss.kbd}>Esc</kbd> to close
          </span>
        </div>
      </div>
    </div>
  );
}

/** The member's most recently updated app, which the AI Apps hint names in its prompt. */
export const LATEST_APP = mockAiApps.find((app) => app.memberUid === currentUser.uid)!.name;

/**
 * AI Apps list page, as the ai-apps prototype draws it on production's page and grid
 * scss (no filter rail). The hint sits between the header and the grid, where LAB-3062
 * mounts it. "No apps yet" drops the member's own apps, so the grid is everyone else's.
 */
export function AppsListHost({
  hint,
  hasApps,
  onCreate,
}: {
  hint: ReactNode;
  hasApps: boolean;
  onCreate: () => void;
}) {
  const apps = hasApps ? mockAiApps : mockAiApps.filter((app) => app.memberUid !== currentUser.uid);
  return (
    <div className={aiAppsList.shell}>
      <div className={`${appsPage.content} ${aiAppsList.column}`}>
        <div className={appsPage.header}>
          <div className={appsPage.titleBlock}>
            <div className={aiAppsList.titleRow}>
              <h1 className={appsPage.title}>{mockPageCopy.title}</h1>
              <span className={aiAppsList.count}>({apps.length})</span>
            </div>
            <p className={appsPage.description}>{mockPageCopy.description}</p>
          </div>
        </div>
        <div className={s.hostHintApps}>{hint}</div>
        <div className={`${appsGrid.grid} ${aiAppsList.gridEqual}`}>
          <AddAiAppCard onClick={onCreate} />
          {apps.map((app) => (
            <AiAppCard
              key={app.uid}
              app={app}
              canManage={app.memberUid === currentUser.uid}
              onSelect={() => {}}
              onEdit={() => {}}
              onDeployment={() => {}}
              onLogs={() => {}}
              onDelete={() => {}}
              onViewOnePager={() => {}}
            />
          ))}
        </div>
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
