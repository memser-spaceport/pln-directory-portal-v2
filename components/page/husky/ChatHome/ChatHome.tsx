import React, { useRef, useState, useEffect } from 'react';

import { useHuskyAnalytics } from '@/analytics/husky.analytics';

import { checkIsLimitReached } from './utils/checkIsLimitReached';

import ChatComposer from '../chat-composer';
import { LimitNotice } from './components/LimitNotice';
import { PromptSuggestions } from './components/PromptSuggestions';

import s from './ChatHome.module.scss';

interface Props {
  onSubmit: (query: string) => void;
  setMessages: (messages: any[]) => void;
  setType: (type: string) => void;
}

export const ChatHome = (props: Props) => {
  const { onSubmit, setMessages, setType } = props;

  const [limitReached, setLimitReached] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const analytics = useHuskyAnalytics();

  // The limit notice shows without focus, so check after mount; the frame keeps setState out of the effect body.
  useEffect(() => {
    const frame = requestAnimationFrame(() => setLimitReached(checkIsLimitReached()));
    return () => cancelAnimationFrame(frame);
  }, []);

  const handlePromptSubmission = () => {
    const textarea = textareaRef.current;
    const query = textarea?.value.trim();
    if (!textarea || !query) {
      return;
    }

    const isLimitReached = checkIsLimitReached();
    setLimitReached(isLimitReached);
    if (isLimitReached) {
      return;
    }

    analytics.trackHuskyHomeSearch(query, 'husky-page');
    onSubmit(query);
    textarea.value = '';
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const isMobileOrTablet = /Mobi|Android|iPad|iPhone/i.test(navigator.userAgent);
    if (!isMobileOrTablet && window.innerWidth >= 1024 && e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handlePromptSubmission();
    }
  };

  const handlePromptSelect = (prompt: any) => {
    analytics.trackExplorationPromptSelection(prompt.question, 'husky-page');
    const links = prompt.answerSourceLinks?.map((item: any) => item?.link);
    setMessages([{ ...prompt, sources: links, followUpQuestions: prompt.followupQuestions }]);
    setType('blog');
  };

  return (
    <div className={s.root}>
      <div className={s.header}>
        <h3 className={s.title}>Explore Protocol Labs with AI</h3>
        <p className={s.scope} data-testid="chat-home-scope">
          Answers come from the directory: members, teams, projects, events and forum posts.
        </p>
      </div>
      <form className={s.form}>
        <ChatComposer
          size="home"
          placeholder="Go ahead, ask anything!"
          rows={1}
          ref={textareaRef}
          autoFocus
          onFocus={() => setLimitReached(checkIsLimitReached())}
          onKeyDown={handleKeyDown}
          onTextSubmit={handlePromptSubmission}
        />
      </form>
      {limitReached && <LimitNotice />}
      <PromptSuggestions onSelect={handlePromptSelect} />
    </div>
  );
};
