'use client';
interface RoundedTabsProps {
  items: string[];
  activeItem: string;
  onTabSelected: (item: string) => void;
}

function RoundedTabs({ activeItem, items, onTabSelected }: RoundedTabsProps) {
  return (
    <>
      <div className="hc__tab">
        {items.map((item) => (
          <p key={item} className={`hc__tab__item ${item === activeItem ? 'hc__tab__item--active' : ''}`} onClick={() => onTabSelected(item)}>{item}</p>
        ))}
      </div>
      <style jsx>
        {`
          .hc__tab {
            width: 100%;
            height: 48px;

            display: flex;
            align-items: center;
            justify-content: flex-start;
            gap: 16px;
            padding: 0 16px;
            background: white;
          }
          .hc__tab__item {
            font-size: 12px;
            font-weight: 400;
            padding: 4px 12px;
            border: 1px solid #e2e8f0;
            border-radius: 43px;
            background: white;
            color: black;
            cursor: pointer;
            text-transform: capitalize;
          }

          .hc__tab__item--active {
            background: #156ff7;
            color: white;
          }
        `}
      </style>
    </>
  );
}

export default RoundedTabs;
