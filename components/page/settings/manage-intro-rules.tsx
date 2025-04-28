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

const TABS = {
  rules: { id: 'rules', label: 'RULES' },
  topics: { id: 'topics', label: 'TOPICS' },
  tags: { id: 'tags', label: 'TAGS' }
} as const;

type TabType = keyof typeof TABS;

export default function ManageIntroRules({ data, userInfo }: ManageIntroRulesProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabFromUrl = (searchParams.get('tab') as TabType) || 'rules';
  const [activeTab, setActiveTab] = useState<TabType>(
    Object.keys(TABS).includes(tabFromUrl) ? tabFromUrl : 'rules'
  );
  const [showMobileDropdown, setShowMobileDropdown] = useState(false);
  const [rules, setRules] = useState<Rule[]>(data.rules);
  const [topics, setTopics] = useState<Topic[]>(data.topics);
  const [tags, setTags] = useState<Tag[]>(data.tags);
  const [members, setMembers] = useState<any[]>(data.members);

  const handleTabChange = (tabId: TabType) => {
    setActiveTab(tabId);
    const params = new URLSearchParams(searchParams);
    params.set('tab', tabId);
    router.push(`?${params.toString()}`);
  };


  return (
    <div className="mir">
      {/* Desktop Tabs */}
      <div className="mir__tabs mir__tabs--desktop">
        {Object.values(TABS).map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id as TabType)}
            className={`mir__tabs__btn ${activeTab === tab.id ? 'mir__tabs__btn--active' : ''}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Mobile Dropdown */}
      <div className="mir__tabs--mobile">
        <button 
          className="mir__dropdown__button"
          onClick={() => setShowMobileDropdown(!showMobileDropdown)}
        >
          {TABS[activeTab].label}
          <img 
            src="/icons/arrow-down.svg" 
            alt="toggle" 
            className={`mir__dropdown__arrow ${showMobileDropdown ? 'mir__dropdown__arrow--open' : ''}`}
          />
        </button>
        
        {showMobileDropdown && (
          <div className="mir__dropdown__content">
            {Object.values(TABS).map((tab) => (
              <button
                key={tab.id}
                data-testid="rules-tab"
                onClick={() => {
                  handleTabChange(tab.id as TabType);
                  setShowMobileDropdown(false);
                }}
                className={`mir__dropdown__item ${activeTab === tab.id ? 'mir__dropdown__item--active' : ''}`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="mir__content">
        {activeTab === 'rules' && (
          <RulesTab 
            rules={rules}
            topics={topics}
            tags={tags}
            members={members}
          />
        )}
        {activeTab === 'tags' && (
          <TagsTab 
            tags={tags}
          />
        )}
        {activeTab === 'topics' && (
          <TopicsTab 
            topics={topics}
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
          padding-top: ${activeTab === 'rules' ? '16px' : '0px'};
        }

        .mir__tabs {
          display: flex;
          width: 100%;
          border-bottom: 1px solid #E2E8F0;
          padding: 0 16px;
        }

        .mir__tabs--desktop {
          display: none;
        }

        .mir__tabs--mobile {
          position: relative;
          padding: 16px;
          border-bottom: 1px solid #E2E8F0;
        }

        .mir__dropdown__button {
          width: 100%;
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 16px;
          background: white;
          border: 1px solid #CBD5E1;
          border-radius: 8px;
          font-size: 14px;
          color: #1E293B;
          cursor: pointer;
        }

        .mir__dropdown__arrow {
          width: 10px;
          height: 7px;
          transition: transform 0.2s ease;
        }

        .mir__dropdown__arrow--open {
          transform: rotate(180deg);
        }

        .mir__dropdown__content {
          position: absolute;
          left: 16px;
          right: 16px;
          background: white;
          border: 1px solid #CBD5E1;
          border-radius: 8px;
          margin-top: 4px;
          box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
          z-index: 10;
        }

        .mir__dropdown__item {
          width: 100%;
          text-align: left;
          padding: 8px 16px;
          background: none;
          border: none;
          font-size: 14px;
          line-height: 24px;
          font-weight: 500;
          color: #1E293B;
          cursor: pointer;
        }

        .mir__dropdown__item:hover {
          background: #F8FAFC;
        }

        .mir__dropdown__item--active {
          color: #0066FF;
          background: #F0F7FF;
        }

        @media (min-width: 768px) {
          .mir__tabs--mobile {
            display: none;
          }
          
          .mir__tabs--desktop {
            display: flex;
            justify-content: space-between;
          }

          .mir__content {
          padding-top: 16px;
        }
          
          .mir__tabs__btn {
            flex: 1;
            padding: 12px 0;
            background: none;
            border: none;
            font-size: 14px;
            color: #64748B;
            cursor: pointer;
            border-bottom: 2px solid transparent;
            text-align: center;
            font-weight: 500;
            line-height: 20px;
          }

          .mir__tabs__btn--active {
            color: #0066FF;
            border-bottom-color: #0066FF;
            font-weight: 700;
          }
        }
      `}</style>
    </div>
  );
}