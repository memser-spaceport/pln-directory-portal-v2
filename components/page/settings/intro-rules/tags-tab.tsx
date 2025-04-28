'use client';

import { useEffect, useState } from 'react';
import AddEditTagModal from './add-edit-tag-modal';
import { EVENTS } from '@/utils/constants';

interface Tag {
  id: string;
  name: string;
}

interface TagsTabProps {
  tags: Tag[];
}

export default function TagsTab({ tags }: TagsTabProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredTags, setFilteredTags] = useState(tags);


  useEffect(() => {
    setFilteredTags(tags.filter((tag) => tag.name.toLowerCase().includes(searchQuery.toLowerCase())));
  }, [searchQuery]);

  const handleAddTagBtnClick = () => {
    document.dispatchEvent(new CustomEvent(EVENTS.ADD_EDIT_TAG_MODAL, { detail: { mode: 'add' } }));
  };

  const handleEditTag = (tag: Tag) => {
    document.dispatchEvent(new CustomEvent(EVENTS.ADD_EDIT_TAG_MODAL, { detail: { mode: 'edit', tag } }));
  };

  return (
    <div className="tags">
      <div className="tags__search">
        <div className="tags__search__input">
          <img src="/icons/search-gray.svg" alt="search" width={16} height={16} />
          <input type="text" placeholder="Search" onChange={(e) => setSearchQuery(e.target.value)}/>
        </div>
        <button onClick={handleAddTagBtnClick} className="tags__add-btn">
          Add Tag
        </button>
      </div>

      <div className="tags__list">
        {filteredTags.map((tag) => (
          <div key={tag.id} className="tags__item">
            <span className="tags__item__name">{tag.name}</span>
            <div className="tags__item__actions">
              <button onClick={() => handleEditTag(tag)} className="tags__item__edit">
                <img src="/icons/intro-rules/edit.svg" alt="edit" width={24} height={24} />
              </button>
              <button className="tags__item__delete">
                <img src="/icons/intro-rules/delete.svg" alt="delete" width={24} height={24} />
              </button>
            </div>
          </div>
        ))}
      </div>

      <AddEditTagModal />

      <style jsx>{`
        .tags {
          display: flex;
          flex-direction: column;
          margin-left: -16px;
          margin-right: -16px;
        }

        .tags__search {
          display: flex;
          gap: 12px;
          align-items: center;
          justify-content: space-between;
          padding: 20px 16px;
          border-bottom: 1px solid #E2E8F0;
        }

        .tags__search__input {
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

        .tags__search__input input {
          flex: 1;
          border: none;
          outline: none;
          font-size: 14px;
          color: #64748B;
        }

        .tags__add-btn {
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

        .tags__list {
          display: flex;
          flex-direction: column;
          gap: 12px;
          padding: 16px;
          padding-top: 0;
        }

        .tags__item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px;
          border-bottom: 1px solid #CBD5E1;
        }

        .tags__item__name {
          font-size: 14px;
          color: #1E293B;
        }

        .tags__item__actions {
          display: flex;
          gap: 8px;
        }

        .tags__item__edit,
        .tags__item__delete {
          background: none;
          border: none;
          cursor: pointer;
          padding: 4px;
        }

        .tags__item__edit:hover,
        .tags__item__delete:hover {
          background: #F1F5F9;
          border-radius: 4px;
        }
      `}</style>
    </div>
  );
} 