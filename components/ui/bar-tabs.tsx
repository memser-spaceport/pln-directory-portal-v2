'use client';
interface BarTabsItem {
  name: string;
  key: string;
  activeIcon?: string;
  inActiveIcon?: string;
}
interface BarTabsProps {
  items: BarTabsItem[];
  activeItem: string;
  onTabSelected: (item: string) => void;
  transform?: string;
}

function BarTabs({ activeItem, items, onTabSelected, transform }: BarTabsProps) {
  return (
    <>
      <div className="hc__tab">
        {items.map((item) => (
          <p key={item.key} className={`hc__tab__item ${item.key === activeItem ? 'hc__tab__item--active' : ''}`} onClick={() => onTabSelected(item.key)}>
            {(item.key === activeItem && item.activeIcon) && <img className="hc__tab__item__img" alt={item.name} src={item.activeIcon}/>} 
            {(item.key !== activeItem && item.inActiveIcon) && <img className="hc__tab__item__img" alt={item.name} src={item.inActiveIcon}/>} 
            <span>{item.name}</span>
          </p>
        ))}
      </div>
      <style jsx>
        {`
          .hc__tab {
            width: 100%;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 0px;
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
            padding: 0 4px;
            cursor: pointer;
            display: flex;
            gap: 4px;
            align-items: center;
            text-transform: ${transform ? transform : 'capitalize'};
          }
          
          .hc__tab__item__img {
            width: 16px;
            height: 16px;
          }

          .hc__tab__item--active {
            color: #156ff7;
            padding-top: 2px;
            border-bottom: 2px solid #156ff7;
            font-weight: 500;
          }

          @media (min-width: 1024px) {
            .hc__tab {
              gap: 16px;
              justify-content: flex-start;
            }
            .hc__tab__item {
              padding: 0 16px;
            }
          }
        `}
      </style>
    </>
  );
}

export default BarTabs;
