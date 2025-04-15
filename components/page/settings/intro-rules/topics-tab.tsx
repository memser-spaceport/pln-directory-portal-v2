'use client';

import { useState } from 'react';
import AddEditTopicModal from './add-edit-topic-modal';
import { EVENTS } from '@/utils/constants';

interface Topic {
  id: string;
  name: string;
}

interface TopicsTabProps {
  topics: Topic[];
  onEditTopic: (topicId: string) => void;
  onAddTopic: () => void;
}

export default function TopicsTab({ topics, onEditTopic, onAddTopic }: TopicsTabProps) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const handleAddTopic = () => {
    onAddTopic();
    setIsAddModalOpen(false);
  };

  const handleAddTopicBtnClick = () => {
    document.dispatchEvent(new CustomEvent(EVENTS.ADD_EDIT_TOPIC_MODAL, { detail: { mode: 'add' } }));
  };

  const handleEditTopic = (topic: Topic) => {
    document.dispatchEvent(new CustomEvent(EVENTS.ADD_EDIT_TOPIC_MODAL, { detail: { mode: 'edit', topic } }));
  };

  return (
    <div className="topics">
      <div className="topics__search">
        <div className="topics__search__input">
          <img src="/icons/search-gray.svg" alt="search" width={16} height={16} />
          <input type="text" placeholder="Search" />
        </div>
        <button onClick={handleAddTopicBtnClick} className="topics__add-btn">
          Add Topic
        </button>
      </div>

      <div className="topics__list">
        {topics.map((topic) => (
          <div key={topic.id} className="topics__item">
            <span className="topics__item__name">{topic.name}</span>
            <div className="topics__item__actions">
              <button onClick={() => handleEditTopic(topic)} className="topics__item__edit">
                <img src="/icons/intro-rules/edit.svg" alt="edit" width={24} height={24} />
              </button>
              <button className="topics__item__delete">
                <img src="/icons/intro-rules/delete.svg" alt="delete" width={24} height={24} />
              </button>
            </div>
          </div>
        ))}
      </div>

      <AddEditTopicModal/>

      <style jsx>{`
        .topics {
          display: flex;
          flex-direction: column;
          margin-left: -16px;
          margin-right: -16px;
        }

        .topics__search {
          display: flex;
          gap: 12px;
          align-items: center;
          justify-content: space-between;
          padding: 20px 16px;
          border-bottom: 1px solid #E2E8F0;
        }

        .topics__search__input {
          flex: 1;
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          border: 1px solid #CBD5E1;
          border-radius: 8px;
          max-width: 350px;
          height: 40px;
        }

        .topics__search__input input {
          flex: 1;
          border: none;
          outline: none;
          font-size: 14px;
          color: #64748B;
        }

        .topics__add-btn {
          padding: 8px 16px;
          background: #0066FF;
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          height: 40px;
          max-width: 104px;
        }

        .topics__list {
          display: flex;
          flex-direction: column;
          gap: 12px;
          padding: 16px;
          padding-top: 0;
        }

        .topics__item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px;
          border-bottom: 1px solid #CBD5E1;
        }

        .topics__item__name {
          font-size: 14px;
          color: #1E293B;
        }

        .topics__item__actions {
          display: flex;
          gap: 8px;
        }

        .topics__item__edit,
        .topics__item__delete {
          background: none;
          border: none;
          cursor: pointer;
          padding: 4px;
        }

        .topics__item__edit:hover,
        .topics__item__delete:hover {
          background: #F1F5F9;
          border-radius: 4px;
        }
      `}</style>
    </div>
  );
} 