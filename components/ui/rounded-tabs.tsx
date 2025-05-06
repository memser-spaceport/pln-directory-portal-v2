'use client';

/**
 * Props for the RoundedTabs component.
 * @interface RoundedTabsProps
 * @property {string[]} items - The list of tab names.
 * @property {string} activeItem - The currently active tab.
 * @property {(item: string) => void} onTabSelected - Callback when a tab is selected.
 */
interface RoundedTabsProps {
  items: string[];
  activeItem: string;
  onTabSelected: (item: string) => void;
}

/**
 * RoundedTabs component renders a horizontal list of rounded tab buttons.
 * Highlights the active tab and calls the callback when a tab is clicked.
 *
 * @component
 * @param {RoundedTabsProps} props - The props for RoundedTabs
 * @returns {JSX.Element}
 */
function RoundedTabs({ activeItem, items, onTabSelected }: RoundedTabsProps) {
  return (
    <>
      {/* Tab container */}
      <div className="hc__tab">
        {/* Render each tab item */}
        {items.map((item) => (
          <p key={item} className={`hc__tab__item ${item === activeItem ? 'hc__tab__item--active' : ''}`} onClick={() => onTabSelected(item)}>{item}</p>
        ))}
      </div>
      {/* Inline styles for the component */}
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
