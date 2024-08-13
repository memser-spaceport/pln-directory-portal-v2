'use client';
interface BarTabsProps {
  items: string[];
  activeItem: string;
  onTabSelected: (item: string) => void;
  transform?: string;
}

function BarTabs({ activeItem, items, onTabSelected, transform }: BarTabsProps) {
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
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: flex-start;
            gap: 16px;
            background: white;
            
          }
          .hc__tab__item {
            font-size: 12px;
            font-weight: 400;
            height: 100%;
            display: flex;
            align-items: center;
            padding-top: 0px;
            color: black;
            padding: 0 16px;
            cursor: pointer;
            text-transform: ${transform ? transform : 'capitalize'};
          }

          .hc__tab__item--active {
            color: #156FF7;
             padding-top: 2px;
            border-bottom: 2px solid #156FF7;
            font-weight: 500;
          }
        `}
      </style>
    </>
  );
}

export default BarTabs;
