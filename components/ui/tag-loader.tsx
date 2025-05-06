"use client"

/**
 * TagLoader is a skeleton loader component for tags.
 * It displays a placeholder title and three sets of animated tag placeholders while content is loading.
 *
 * @returns {JSX.Element} The skeleton loader markup for tags.
 */
const TagLoader = () => {
    return <>
        {/* Container for the tag loader skeleton */}
        <div className="tag-loading-container" data-testid="tag-loader-container">
        {/* Title skeleton */}
        <div className="tag-loading-container__title"> </div>
        {/* Tags skeleton row */}
        <div className="tag-loading-container__tags">
          {/* First set of tag skeletons */}
          {Array.from({ length: 3 })?.map((firstSet, index) => (
            <div key={`${firstSet} ${index}`} className="tag-loading-container__tags__tag"> </div>
          ))}
          {/* Second set of tag skeletons */}
          {Array.from({ length: 3 })?.map((secondSet, index) => (
            <div key={`${secondSet} + ${index}`}className="tag-loading-container__tags__tag1"> </div>
          ))}
          {/* Third set of tag skeletons */}
          {Array.from({ length: 3 })?.map((thirdSet, index) => (
            <div key={`${thirdSet} + ${index}`} className="tag-loading-container__tags__tag2"> </div>
          ))}
        </div>
      </div>

      {/* Inline styles for skeleton animation and layout */}
      <style jsx>
        {`
         .tag-loading-container {
            display: flex;
            gap: 16px;
            flex-direction: column;
          }
        
          .tag-loading-container__title {
            width: 137px;
            height: 20px;
            background-color: #e2e8f0;
            border-radius: 4px;
            animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
          }
        
          .tag-loading-container__tags {
            display: flex;
            flex-wrap: wrap;
            width: 100%;
            gap: 8px;
          }
        
          .tag-loading-container__tags__tag {
            height: 26px;
            width: 70px;
            border-radius: 24px;
            background-color: #e2e8f0;
            animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
          }
        
          .tag-loading-container__tags__tag1 {
            height: 26px;
            width: 90px;
            border-radius: 24px;
            background-color: #e2e8f0;
            animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
          }
        
          .tag-loading-container__tags__tag2 {
            height: 26px;
            width: 80px;
            border-radius: 24px;
            background-color: #e2e8f0;
            animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
          }
        `}

      </style>
      </>
}

export default TagLoader;