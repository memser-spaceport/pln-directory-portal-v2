import { useState } from 'react';
import clip from 'text-clipper';
import { safeHtmlProps, sanitizeHtml } from '@/utils/html';

interface IMemberExperienceDescription {
  desc: string;
}

function MemberExperienceDescription(props: IMemberExperienceDescription) {
  const fullDesc = props?.desc || '';
  const shortDesc = fullDesc;
  const [isShowMoreActive, showMoreStatus] = useState(false);
  const isBigDesc = fullDesc?.length >= 300;

  const onShowMore = () => {
    showMoreStatus(true);
  };

  const onShowLess = () => {
    showMoreStatus(false);
  };
  // Function to truncate HTML content without breaking tags
  const truncateHTML = (html: string, maxLength: number): string => {
    const sanitizedHTML = sanitizeHtml(html);
    const clippedHtml = clip(sanitizedHTML, maxLength, { html: true, maxLines: 5 });
    return clippedHtml;
  };

  return (
    <>
      {isBigDesc && (
        <div className="med">
          {!isShowMoreActive && (
            <div className="med__btn">
              <div className="med__text" {...safeHtmlProps(truncateHTML(shortDesc, 250))}></div>
              <span onClick={onShowMore} className="med__btn__txt">
                Show More
              </span>
            </div>
          )}
          {isShowMoreActive && (
            <div className="med__btn">
              <div className="med__text" {...safeHtmlProps(fullDesc)}></div>
              <span onClick={onShowLess} className="med__btn__txt">
                Show Less
              </span>
            </div>
          )}
        </div>
      )}

      {!isBigDesc && <div {...safeHtmlProps(fullDesc)} className="med__text"></div>}

      <style jsx>{`
        .med__btn {
          font-size: 14px;
          line-height: 24px;
          color: #475569;
        }

        .med__btn__txt {
          color: #156ff7;
          font-style: italic;
          cursor: pointer;
        }
      `}</style>
    </>
  );
}

export default MemberExperienceDescription;
