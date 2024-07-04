import React from 'react';

interface TabsProps {
  tabs: string[];
  activeTab: string;
  onTabClick: (item: string) => void;
}

const Tabs: React.FC<TabsProps> = ({ tabs, activeTab, onTabClick }) => {
  return (
    <div className="tabs">
      <div className="tabs__list">
        {tabs.map((tab, index) => (
          <button
            key={`${tab}-${index}`}
            className={`tabs__tab ${tab === activeTab ? 'tabs__tab--active' : ''}`}
            onClick={() => onTabClick(tab)}
          >
            <p className={`tabs__tab__text ${tab === activeTab ? 'tabs__tab__text--active': ''}`}>{tab}</p>
          </button>
        ))}
      </div>
      <style jsx>{`
        .tabs__list {
          display: flex;
          width: 100%;
          justify-content: space-between;
        }
        .tabs__tab {
          padding: 10px 20px;
          cursor: pointer;
          background: none;
          border: none;
          border-bottom: 2px solid transparent;
          flex: 1;
          transition: border-bottom 0.3s ease;
        }
        .tabs__tab--active {
          border-bottom: 2px solid #156FF7;
          
        }
        .tabs__tab__text {
          font-size: 14px;
          font-weight: 400;
          text-transform: uppercase;
          color: #94A3B8;
        }
        .tabs__tab__text--active {
           font-weight: 700;
           color: #156FF7;
        }
      `}</style>
    </div>
  );
};

export default Tabs;
