'use client';

import { useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import RulesTab from './intro-rules/rules-tab';
import TagsTab from './intro-rules/tags-tab';
import TopicsTab from './intro-rules/topics-tab';
import { IntroRuleData, Rule, Topic, Tag } from '@/types/intro-rules';

interface ManageIntroRulesProps {
  data: IntroRuleData;
  userInfo: any;
}

type TabType = 'rules' | 'tags' | 'topics';

const TABS: Record<TabType, { id: TabType; label: string }> = {
  rules: { id: 'rules', label: 'RULES' },
  tags: { id: 'tags', label: 'TAGS' },
  topics: { id: 'topics', label: 'TOPICS' }
};

export default function ManageIntroRules({ data, userInfo }: ManageIntroRulesProps) {
  console.log(data);
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabFromUrl = searchParams.get('tab') as TabType;
  
  const [activeTab, setActiveTab] = useState<TabType>(
    Object.keys(TABS).includes(tabFromUrl) ? tabFromUrl : 'rules'
  );
  const [rules, setRules] = useState<Rule[]>(data.rules);
  const [topics, setTopics] = useState<Topic[]>(data.topics);
  const [tags, setTags] = useState<Tag[]>(data.tags);

  const handleTabChange = (tabId: TabType) => {
    setActiveTab(tabId);
    const params = new URLSearchParams(searchParams);
    params.set('tab', tabId);
    router.push(`?${params.toString()}`);
  };

  const handleAddRule = () => {
    // Add new rule logic
  };

  const handleEditRule = (ruleId: string) => {
    // Edit rule logic
  };

  return (
    <div className="mir">
      <div className="mir__header">
        <div className="mir__tabs">
          {Object.values(TABS).map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`mir__tabs__btn ${activeTab === tab.id ? 'mir__tabs__btn--active' : ''}`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mir__content">
        {activeTab === 'rules' && (
          <RulesTab 
            rules={rules}
            topics={topics}
            tags={tags}
            onEditRule={handleEditRule}
            onAddRule={handleAddRule}
          />
        )}
        {activeTab === 'tags' && (
          <TagsTab 
            tags={tags}
            onEditTag={(id) => console.log('edit tag', id)}
            onAddTag={() => console.log('add tag')}
          />
        )}
        {activeTab === 'topics' && (
          <TopicsTab 
            topics={topics}
            onEditTopic={(id) => console.log('edit topic', id)}
            onAddTopic={() => console.log('add topic')}
          />
        )}
      </div>

      <style jsx>{`
        .mir {
          width: 100%;
          height: calc(100vh - 128px);
          display: flex;
          flex-direction: column;
          border-left: 1px solid #E2E8F0;
          border-right: 1px solid #E2E8F0;
        }

        @media (min-width: 1024px) {
          .mir {
            width: 656px;
            display: flex;
            justify-content: center;
          }
        }

        .mir__header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid #E2E8F0;
          margin-top: 18px;
        }

        .mir__content {
          flex: 1;
          overflow-y: auto;
          padding: 16px;
        }

        .mir__tabs {
          display: flex;
          width: 100%;
        }

        .mir__tabs__btn {
          flex: 1;
          padding: 8px 16px;
          border: none;
          background: none;
          font-size: 14px;
          color: #64748B;
          cursor: pointer;
          font-weight: 600;
          text-align: center;
          border-bottom: 2px solid transparent;
        }

        .mir__tabs__btn--active {
          color: #0066FF;
          border-bottom: 2px solid #0066FF;
        }
      `}</style>
    </div>
  );
}