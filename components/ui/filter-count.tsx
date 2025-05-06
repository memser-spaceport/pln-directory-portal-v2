/**
 * Props for the FilterCount component.
 * @interface IFilterCount
 * @property {number} count - The number to display in the filter count badge.
 */
interface IFilterCount {
    count: number;
  }
  
  /**
   * FilterCount displays a circular badge with a count, typically used for showing the number of active filters.
   *
   * @param {IFilterCount} props - The props for the component.
   * @returns {JSX.Element} The rendered filter count badge.
   */
  const FilterCount = (props: IFilterCount) => {
    const count = props?.count;
    return (
      <>
        {/* Badge displaying the count */}
        <div className="filter-count">{count}</div>
  
        {/* Inline styles for the badge */}
        <style jsx>
          {`
            .filter-count {
              display: flex;
              width: 20px;
              height: 20px;
              align-items: center;
              justify-content: center;
              color: white;
              border-radius: 50%;
              background-color: #156ff7;
              font-size: 12px;
              font-weight: 500;
              line-height: 14px;
              text-align: center;
            }
  
            @mdedia (min-width: 1024px) {
              .filter-count {
                height: 24px;
                width: 24px;
              }
            }
          `}
        </style>
      </>
    );
  };
  
  export default FilterCount;
  