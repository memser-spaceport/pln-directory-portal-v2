'use client';

import { ChangeLogList, tagColors } from '@/utils/constants';

const ChangelogList = () => {
  return (
    <>
      <section className="changelog" aria-label="Changelog Section">
        <header className="changelog__hdr">
          <h1 className="changelog__hdr__txt" aria-label="Changelog Title">
            Changelog
          </h1>
        </header>
        <div className="change-logs-container" role="list" aria-label="List of changelogs">
          {ChangeLogList.map((changeLog, index) => {
            const tagColor = tagColors.find((item: any) => item.name === changeLog.tag)?.color;
            const releaseType = changeLog?.releaseType?.name;
            const releaseTypeImg = changeLog?.releaseType?.icon;
            return (
              <div
                aria-label={`Changelog entry for ${changeLog.title} on ${changeLog.date}`}
                role="listitem"
                className={`change-log-entry ${index !== ChangeLogList.length - 1 ? 'change-log-entry-border' : ''}`}
                key={`changelog-${index}`}
                data-testid={`changelog-${index}`}
              >
                <div className="change-log-header">
                  <time className="change-log-date" dateTime={changeLog.date}>
                    {changeLog.date}
                  </time>
                  <span className="change-log-tag" aria-label={`Tag: ${changeLog.tag}`}>
                    <span style={{ backgroundColor: tagColor }} className="change-log-tag-color" />
                    <span className="change-log-tag-text">{changeLog.tag}</span>
                  </span>
                  {releaseType && (
                    <span className="change-log-tag-releaseType" aria-label={`Release Type: ${releaseType}`}>
                      <img src={releaseTypeImg} width={14} height={14} alt="tag" />
                      <span className="change-log-tag-text">{releaseType}</span>
                    </span>
                  )}
                </div>
                <div className="change-log-content">
                  <h2 className="change-log-title" aria-label={changeLog.title}>
                    {changeLog.title}
                  </h2>
                  <div className="change-log-short-content" dangerouslySetInnerHTML={{ __html: changeLog.shortContent }}></div>
                </div>
              </div>
            );
          })}
        </div>
      </section>
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
          font-size: 24px;
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
          gap: 7px;
          border-radius: 24px;
          border: 1px solid #cbd5e1;
          padding: 6px 8px;
        }

        .change-log-tag-releaseType {
          display: inline-flex;
          height: 27px;
          align-items: center;
          gap: 4px;
          border-radius: 24px;
          border: 1px solid #cbd5e1;
          padding: 6px 8px;
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
