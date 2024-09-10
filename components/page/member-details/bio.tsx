'use client';

import { useState } from 'react';
import clip from 'text-clipper';

const Bio = ({ content }: { content: string }) => {
  const [showMore, setShowMore] = useState(false);

  const clippedHtml = clip(content, 450, { html: true, maxLines: 5 });

  // Handle "Show more" / "Show less" click
  const onShowMoreClickHandler = (e: any) => {
    if (e.target.tagName === 'BUTTON') {
      setShowMore((prev) => !prev);
    }
  };

  const onShowMoreClicked = ()=> {}

  const onShowLesClicked = ()=> {}

  return (
    <>
      <div className="bioCn" onClick={onShowMoreClickHandler}>
        <h2 className="bioCn__ttl">Bio</h2>
        <div className="bioCn__content" dangerouslySetInnerHTML={{ __html: showMore ? content : clippedHtml }} />
        <span>{!showMore ? <button className="bioCn__toggle-btn">show more</button> : <button className="bioCn__toggle-btn desc">&nbsp;show less</button>}</span>
      </div>

      <style jsx>{`
        .bioCn {
          border-top: 1px solid #cbd5e1;
          padding: 16px;
        }

        .bioCn__ttl {
          color: #64748b;
          font-size: 14px;
          font-weight: 500;
          line-height: 20px;
          margin-bottom: 10px;
        }

        .bioCn__content {
          font-size: 14px;
          font-weight: 400;
          line-height: 20px;
          color: #000000;
          display: inline;
        }

        .bioCn__toggle-btn {
          font-size: 14px;
          font-weight: 500;
          line-height: 22px;
          text-align: center;
          color: #156ff7;
          background: transparent;
        }

        .desc {
          display: inline-block;
        }

        @media (min-width: 1024px) {
          .bioCn {
            padding: 20px;
          }

          .desc {
            display: none;
          }
        }
      `}</style>
    </>
  );
};

export default Bio;
