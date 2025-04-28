'use client';

import { useState } from 'react';
import AddEditRuleModal from './add-edit-rule-modal';
import { EVENTS } from '@/utils/constants';
import { Rule, Topic, Tag } from '@/types/intro-rules';

interface RulesTabProps {
  rules: Rule[];
  topics: Topic[];
  tags: Tag[];
  members: any[];
}

export default function RulesTab({ rules, topics, tags, members }: RulesTabProps) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const handleAddRule = (data: any) => {
    setIsAddModalOpen(false);
  };

  const handleAddRuleBtnClick = () => {
    document.dispatchEvent(new CustomEvent(EVENTS.ADD_EDIT_RULE_MODAL, { detail: { mode: 'add' } }));
  };


  const handleEditRule = (rule: Rule) => {
    document.dispatchEvent(new CustomEvent(EVENTS.ADD_EDIT_RULE_MODAL, { detail: { mode: 'edit', rule } }));
  };

  return (
    <div className="rules">
        <button onClick={handleAddRuleBtnClick} className="rules__add-btn">
        Add New Rule
      </button>

      <div className="rules__list">
        {rules.map((rule) => (
          <div key={rule.id} className="rules__item">
            <div className="rules__item__content">
              <div className="rules__item__header">
                <div className="rules__item__header__left">
                <h3 className="rules__item__title">{rule.topic.name}</h3>
                <div className="rules__item__leads">
                  <img src="/icons/profile.svg" alt="leads" width={16} height={16} />
                  <span>{rule.leads.length} Leads</span>
                </div>
                
                </div>
                <div className="rules__item__header__right">
                <button 
                  onClick={() => handleEditRule(rule)} 
                  className="rules__item__edit"
                >
                  Edit  
                </button>
                </div>
                
              </div>
              <div className="rules__item__tags">
                {rule.tags.length > 0 && rule.tags.slice(0, 4).map((tag, index) => (
                  <span key={index} className="rules__item__tag">
                    {tag.name}
                  </span>
                ))}
                {rule.tags.length > 4 && <span className="rules__item__tag">+{rule.tags.length - 4}</span>}
              </div>
            </div>
          </div>  
        ))}
      </div>

      <AddEditRuleModal 
        topics={topics}
        tags={tags}
        members={members}
        onSubmit={handleAddRule}
      />
      

      <style jsx>{`
        .rules {
          display: flex;
          flex-direction: column;
          gap: 16px;
          
        }

        .rules__add-btn {
          width: 100%;
          padding: 12px;
          background: white;
          color: #156FF7;
          border: 1px solid #156FF7;
          border-radius: 8px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          text-align: center;
          line-height: 20px;
        }

        .rules__add-btn:hover {
          background: #F8FAFC;
        }

        .rules__list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .rules__item__content {
          display: flex;
          flex-direction: column;
          gap: 30px;
        }
        .rules__item {
          border: 1px solid #CBD5E1;
          border-radius: 8px;
          padding: 12px;
        }

        .rules__item__header {
          display: flex;
          justify-content: space-between;
          gap: 12px;
        }

        .rules__item__title {
          margin: 0;
          flex: 1;
        font-weight: 600;
        font-size: 14px;
        line-height: 20px;
        letter-spacing: 0%;
        }

        .rules__item__header__left {
            display: flex;
            flex-direction: column;
            align-items: flex-start;
            gap: 7px;
        }

        .rules__item__leads {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 12px;
          line-height: 14px;
          font-weight: 500;
          color: #0F172A;
          border: 1px solid var(--Neutral-Slate-300, #CBD5E1);
            border-radius: 4px;
            padding-top: 6px;
            padding-right: 6px;
            padding-bottom: 6px;
            padding-left: 4px;
            border-width: 1px;

        }

        .rules__item__edit {
          color: #0066FF;
          background: none;
          border: none;
          cursor: pointer;
            font-weight: 500;
            font-size: 12px;
            line-height: 14px;
            letter-spacing: 0%;
        }

        .rules__item__tags {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .rules__item__tag {
          padding: 4px 12px;
          background: white;
          border: 1px solid #E2E8F0;
          border-radius: 24px;
          font-size: 12px;
          line-height: 14px;
          font-weight: 500;
          color: #0F172A;
        }

        .rules__item__tag--more {
          background: #F1F5F9;
          border: none;
        }
      `}</style>
    </div>
  );
} 