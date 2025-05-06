'use client';

import FocusAreaDisplay from '@/components/core/focus-area-display';
import { IFocusArea } from '@/types/shared.types';

/**
 * Props for the SelectedFocusAreas component.
 */
interface SelectedFocusAreasProps {
  focusAreas: IFocusArea[];
  selectedFocusAreas: any[];
}

/**
 * Renders the selected focus areas section with a title and FocusAreaDisplay.
 */
const SelectedFocusAreas: React.FC<SelectedFocusAreasProps> = ({ focusAreas, selectedFocusAreas }) => {
  // Section: Main render
  return (
    <>
      {/* Container for focus area selection */}
      <div className="focus">
        <h2 className="focus__title">Focus Area</h2>
        {/* Renders the focus area display with provided data */}
        <FocusAreaDisplay rawData={focusAreas} selectedItems={selectedFocusAreas} />
      </div>
      {/* Inline styles for the component */}
      <style jsx>
        {`
          .focus {
            width: 100%;
            height: 100%;
            padding: 20px;
            border-radius: 8px;
            background: #fff;
            display: flex;
            flex-direction: column;
            gap: 8px;
            box-shadow: 0px 4px 4px 0px rgba(15, 23, 42, 0.04), 0px 0px 1px 0px rgba(15, 23, 42, 0.12);
          }

          .focus__title {
            font-size: 14px;
            font-weight: 500;
            line-height: 20px;
          }
        `}
      </style>
    </>
  );
};

export default SelectedFocusAreas;
