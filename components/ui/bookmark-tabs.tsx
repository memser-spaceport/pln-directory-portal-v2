import React from 'react';

interface TabItem {
  key: string;
  displayText: string;
  image?: string;
}

interface BookmarkTabsProps {
  tabItems: TabItem[];
  activeTab: string;
  onTabSelect: (tab: string) => void;
}

const BookmarkTabs: React.FC<BookmarkTabsProps> = ({ tabItems, activeTab, onTabSelect }) => {
  return (
    <>
      <div className="bookmark-tabs">
        {tabItems.map(({ key, displayText, image }) => (
          <div key={key} className={`bookmark-tabs__item ${key === activeTab ? 'bookmark-tabs__item--active' : ''}`} onClick={() => onTabSelect(key)}>
            {image && <img src={image} alt={displayText} className="tab-icon" />} {/* Render image if provided */}
            {displayText}
          </div>
        ))}
      </div>
      <style jsx>{`
        .bookmark-tabs {
          display: flex;
          border-bottom: 1px solid #cbd5e1;
          padding: 0 16px;
          
        }
        .bookmark-tabs__item {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 10px;
          cursor: pointer;
          background-color: #f1f5f9;
          border-radius: 5px 5px 0px 0px;
          font-size: 14px;
          font-weight: 500;
          line-height: 16px;
          letter-spacing: 0em;
          text-align: left;
          color: #64748B;
        }
        .bookmark-tabs__item--active {
          background-color: #ffffff;
          color: #156FF7;
          border-left: 1px solid #E2E8F0;
          border-top: 1px solid #E2E8F0;
          border-right: 1px solid #E2E8F0;
          border-bottom: 1px solid transparent;
          margin-bottom: -1px;
        }
      `}</style>
    </>
  );
};

export default BookmarkTabs;
