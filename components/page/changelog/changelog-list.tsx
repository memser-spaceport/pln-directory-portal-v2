'use client';

import { ChangeLogList, tagColors } from '@/utils/constants';

const ChangelogList = () => {
  return (
    <>
      <div className="changelog">
        <div className="changelog__hdr">
          <h1 className="changelog__hdr__txt">Changelog</h1>
        </div>
        <div className="change-logs-container">
          {ChangeLogList.map((changeLog, index) => {
            const tagColor = tagColors.find((item: any) => item.name === changeLog.tag)?.color;
            return (
              <div className={`change-log-entry ${index !== ChangeLogList.length - 1 ? 'change-log-entry-border' : ''}`} key={`changelog-${index}`}>
                <div className="change-log-header">
                  <span className="change-log-date">{changeLog.date}</span>
                  <span className="change-log-tag">
                    <span style={{ backgroundColor: tagColor }} className="change-log-tag-color" />
                    <span className="change-log-tag-text">{changeLog.tag}</span>
                  </span>
                  {changeLog.isBeta && (
                    <span>
                      <img src="/icons/beta-logo.svg" alt="beta logo" />
                    </span>
                  )}
                </div>
                <div className="change-log-content">
                  <h6 className="change-log-title">{changeLog.title}</h6>
                  <div className="change-log-short-content" dangerouslySetInnerHTML={{ __html: changeLog.shortContent }}></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <style jsx>{`
        .changelog {
          display: flex;
          flex-direction: column;
          margin: 20px 0px;
        }

        .changelog__hdr {
          padding: 0px 0px 0px 20px;
        }

        .changelog__hdr__txt {
          color: #0f172a;
        }

        .change-log-title {
          color: #0f172a;
          font-size: 16px;
          font-weight: bold;
          line-height: 20px;
        }

        .change-logs-container {
          display: flex;
          height: 100%;
          width: 100%;
          flex-direction: column;
          padding: 20px;
          gap: 20px;
          background-color: white;
        }

        .change-log-entry {
          display: flex;
          flex-direction: column;
          gap: 12px;
          padding-bottom: 20px;
        }

        .change-log-entry-border {
          border-bottom: 1px solid #cbd5e1;
        }

        .change-log-header {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .change-log-date {
          font-size: 14px;
          font-weight: 500;
          color: #0f172a;
        }

        .change-log-tag {
          display: inline-flex;
          height: 27px;
          align-items: center;
          gap: 4px;
          border-radius: 24px;
          border: 1px solid #cbd5e1;
          padding-left: 12px;
          padding-right: 12px;
          padding-top: 6px;
          padding-bottom: 6px;
        }

        .change-log-tag-color {
          display: inline-block;
          height: 8px;
          width: 8px;
          border-radius: 50%;
        }

        .change-log-tag-text {
          font-size: 12px;
          color: #475569;
        }

        .change-log-content {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        @media (min-width: 1024px) {
          .changelog__hdr {
            padding: 0px;
          }

          .changelog {
            margin: 40px 0px;
            gap: 20px;
          }

          .change-logs-container {
            border-radius: 8px;
            border: 1px solid #e2e8f0;
          }

          .change-logs-container {
            padding: 32px;
          }
        }
      `}</style>
    </>
  );
};

export default ChangelogList;
