interface IFilterCount {
    count: number;
  }
  
  const FilterCount = (props: IFilterCount) => {
    const count = props?.count;
    return (
      <>
        <div className="filter-count">{count}</div>
  
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
  