'use client';

import { useMemberAnalytics } from '@/analytics/members.analytics';
import { IMember } from '@/types/members.types';
import { getAnalyticsMemberInfo } from '@/utils/common.utils';
import { useState } from 'react';
import clip from 'text-clipper';

const Bio = ({ member }: { member: IMember }) => {
  const content = member?.bio ?? '';
  const clippedHtml = clip(content, 450, { html: true, maxLines: 5 });

  const [readMore, setReadMore] = useState(false);
  const analytics = useMemberAnalytics();

  const onreadMoreClicked = () => {
    setReadMore((prev) => !prev);
    analytics.onMemberDetailsBioReadMoreClicked(getAnalyticsMemberInfo(member));
  };

  const onShowLessClicked = () => {
    setReadMore((prev) => !prev);
    analytics.onMemberDetailsBioReadLessClicked(getAnalyticsMemberInfo(member));
  };

  return (
    <>
      <div className="bioCn">
        <h2 className="bioCn__ttl">Bio</h2>
        <div className="bioCn__content" dangerouslySetInnerHTML={{ __html: readMore ? content : clippedHtml }} />
        <span>
          {!readMore ? (
            <button onClick={onreadMoreClicked} className="bioCn__toggle-btn">
              read more
            </button>
          ) : (
            <button onClick={onShowLessClicked} className="bioCn__toggle-btn desc">
              &nbsp;read less
            </button>
          )}
        </span>
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
