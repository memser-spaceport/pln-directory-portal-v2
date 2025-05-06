import React from 'react';

/**
 * Represents a single tab item for BookmarkTabs.
 * @interface TabItem
 * @property {string} key - Unique key for the tab.
 * @property {string} displayText - Text to display for the tab.
 * @property {string} [image] - Optional image URL for the tab icon.
 */
interface TabItem {
  key: string;
  displayText: string;
  image?: string;
}

/**
 * Props for the BookmarkTabs component.
 * @interface BookmarkTabsProps
 * @property {TabItem[]} tabItems - Array of tab items to display.
 * @property {string} activeTab - The key of the currently active tab.
 * @property {(tab: string) => void} onTabSelect - Callback when a tab is selected.
 */
interface BookmarkTabsProps {
  tabItems: TabItem[];
  activeTab: string;
  onTabSelect: (tab: string) => void;
}

/**
 * BookmarkTabs renders a horizontal tab bar with optional icons.
 * Highlights the active tab and calls the callback when a tab is clicked.
 *
 * @component
 * @param {BookmarkTabsProps} props - The props for BookmarkTabs
 * @returns {JSX.Element}
 */
const BookmarkTabs: React.FC<BookmarkTabsProps> = ({ tabItems, activeTab, onTabSelect }) => {
  return (
    <>
      {/* Tab bar container */}
      <div className="bookmark-tabs">
        {/* Render each tab item */}
        {tabItems.map(({ key, displayText, image }) => (
          <div key={key} className={`bookmark-tabs__item ${key === activeTab ? 'bookmark-tabs__item--active' : ''}`} onClick={() => onTabSelect(key)}>
            {image && <img src={image} alt={displayText} className="tab-icon" />} {/* Render image if provided */}
            {displayText}
          </div>
        ))}
      </div>
      {/* Inline styles for the component */}
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
