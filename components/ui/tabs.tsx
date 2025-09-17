import React from 'react';

interface TabsProps {
  tabs: any[];
  activeTab: string;
  errorInfo?: any;
  onTabClick: (item: string) => void;
}

const Tabs: React.FC<TabsProps> = ({ tabs, errorInfo = {}, activeTab, onTabClick }) => {
  return (
    <div className="tabs">
      <div className="tabs__list">
        {tabs.map((tab, index) => (
          <div
            key={`${tab.name}-${index}`}
            className={`tabs__tab ${tab.name === activeTab ? 'tabs__tab--active' : ''} ${errorInfo[tab.name] === true && tab.name === activeTab ? 'tabs__tab--error' : ''}`}
            onClick={() => onTabClick(tab.name)}
          >
            <p
              className={`tabs__tab__text ${tab.name === activeTab ? 'tabs__tab__text--active' : ''} ${errorInfo[tab.name] === true ? 'tabs__tab__text--error' : ''}`}
            >
              {tab.name}
            </p>
            {tab.count > 0 && (
              <div className={`tabs__tab__count ${tab.name === activeTab ? 'tabs__tab__count--active' : ''}`}>
                {tab.count}
              </div>
            )}
          </div>
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
          display: flex;
          justify-content: center;
          gap: 5px;
        }
        .tabs__tab--active {
          border-bottom: 2px solid #156ff7;
        }
        .tabs__tab__text {
          font-size: 14px;
          font-weight: 400;
          text-transform: uppercase;
          color: #94a3b8;
          text-align: center;
        }
        .tabs__tab__text--active {
          font-weight: 700;
          color: #156ff7;
        }
        .tabs__tab__count {
          font-size: 11px;
          width: 28px;
          height: 15px;
          background-color: #94a3b8;
          border-radius: 4px;
          display: flex;
          justify-content: center;
          align-items: center;
          color: white;
        }
        .tabs__tab__count--active {
          background-color: #156ff7;
        }
        .tabs__tab--error {
          border-bottom: 2px solid red;
        }
        .tabs__tab__text--error {
          color: red;
        }
      `}</style>
    </div>
  );
};

export default Tabs;
