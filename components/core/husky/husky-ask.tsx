'use client';

import BarTabs from '@/components/ui/bar-tabs';
import Tabs from '@/components/ui/tabs';
import { useState } from 'react';

function HuskyAsk() {
  const [suggestionTopicSelected, setSuggestionTopic] = useState('TEAMS');
  const [selectedAction, setSuggestedAction] = useState('prompts');
  const prompts = ['How do I apply to speak at a Filcoin event?', 'Are there any virtual events in the Filecoin community?', 'Who are the main sponsors for FIL Brussels?'];
  const suggestionTopics = [
    { name: 'TEAMS', key: 'teams', icon: '' },
    { name: 'PROJECTS', key: 'projects', icon: '' },
    { name: 'IRL GATHERINGS', key: 'irl', icon: '' },
  ];
  const actions = [{ name: 'Suggested Prompts', key: 'prompts', icon: '' }];
  return (
    <>
      <div className="huskyask">
        <p className="huskyask__info">
          Husky's fetching capacities is currently limited to the data from the following teams, projects and events today. You may not get appropriate responses if anything beyond this scope is
          requested.
        </p>
        <div className="huskyask__st">
          <div className="huskyask__st__tab">
            <BarTabs activeItem={suggestionTopicSelected} onTabSelected={(v) => setSuggestionTopic(v)} items={suggestionTopics.map((v) => v.name)} />
          </div>
          <div className="huskyask__st__list">
            <div className="huskyask__st__list__content"></div>
            <div className="huskyask__st__list__info">
              <p>Want Husky to be able to fetch results for your teams, projects and members too?</p>
              <button>Enroll your team</button>
            </div>
          </div>
        </div>
        <div className="huskyask__sp">
          <div className="huskyask__sp__tab">
            {actions.map((action) => (
              <p className="huskyask__sp__tab__item" key={`${action.key}`}>
                {action.name}
              </p>
            ))}
          </div>
          <div className="huskyask__sp__content">
            {selectedAction === 'prompts' && (
              <div className="huskyask__sp__content__list">
                {prompts.map((prompt) => (
                  <p className="huskyask__sp__content__list__item">{prompt}</p>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      <style jsx>
        {`
          .huskyask {
          }

          .huskyask__info {
            font-size: 14px;
            line-height: 24px;
            padding: 12px 16px;
          }

          .huskyask__st {
            width: 100%;
          }
          .huskyask__st__tab {
            height: 36px;
            width: 100%;
            display: flex;
            align-items: center;
            border-bottom: 1px solid #cbd5e1;
            border-top: 1px solid #cbd5e1;
            padding: 0 16px;
            gap: 12px;
          }
          .huskyask__st__tab__item {
            font-size: 12px;
            font-weight: 500;
          }

          .huskyask__sp {
            width: 100%;
          }
          .huskyask__sp__content {
            padding: 16px;
          }
          .huskyask__sp__content__list {
            display: flex;
            flex-direction: column;
            gap: 8px;
          }
          .huskyask__sp__content__list__item {
            padding: 8px 14px;
            background: #f1f5f9;
            font-size: 14px;
            border-radius: 8px;
          }
          .huskyask__sp__tab {
            height: 36px;
            width: 100%;
            display: flex;
            align-items: center;
            border-bottom: 1px solid #cbd5e1;
            border-top: 1px solid #cbd5e1;
            padding: 0 16px;
          }
          .huskyask__sp__tab__item {
            padding: 8px 0;
            font-size: 12px;
            font-weight: 500;
          }
          .huskyask__st__list {
            padding: 16px;
            height: 310px;
            display: flex;
            gap: 8px;
          }
          .huskyask__st__list__content {
            height: 100%;
            overflow-y: scroll;
            width: 180px;
            border: 1px solid grey;
            flex: 1;
          }

          .huskyask__st__list__info {
            flex: 1;
            background: #f1f5f9;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 16px;
            text-align: center;
            font-size: 12px;
            line-height: 18px;
            font-weight: 400;
            gap: 20px;
          }
          @media (min-width: 1024px) {
            .huskyask__st__list__content {
              width: 285px;
            }
          }
        `}
      </style>
    </>
  );
}

export default HuskyAsk;
