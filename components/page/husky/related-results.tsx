'use client';

import { useHuskyAnalytics } from '@/analytics/husky.analytics';

interface RelatedResultsProps {
  actions: {
    name: string;
    type: string;
    directoryLink: string;
  }[];
}
function RelatedResults({ actions }: RelatedResultsProps) {
  const { trackHuskyActionCardClicked } = useHuskyAnalytics();

  const onActionCardClicked = (action: any) => {
    trackHuskyActionCardClicked(action);
  };

  return (
    <>
      <div className="related-results">
        <div className="related-results__header">
          <h3 className="related-results__title">
            <img width={16} height={16} src="/icons/husky-brain.svg" />
            <span>Related results</span>
          </h3>
        </div>
        <div className="related-results__cn">
          {actions.map((action: any, index: number) => (
            <a
              target="_blank"
              href={action.directoryLink}
              onClick={() => onActionCardClicked(action)}
              className="related-results__cn__item"
              key={index}
            >
              <div className="related-results__cn__item__wrpr">
                <div className="actions__cn__item__name__iconWrpr">
                  {action.type?.toLowerCase() === 'member' && (
                    <img className="actions__cn__item__name__icon" src="/icons/husky/husky-member.svg" alt="icon" />
                  )}
                  {action.type?.toLowerCase() === 'team' && (
                    <img className="actions__cn__item__name__icon" src="/icons/husky/husky-team.svg" alt="icon" />
                  )}
                  {action.type?.toLowerCase() === 'project' && (
                    <img className="actions__cn__item__name__icon" src="/icons/husky/husky-project.svg" alt="icon" />
                  )}
                  {action.type?.toLowerCase() === 'event' && (
                    <img className="actions__cn__item__name__icon" src="/icons/husky/husky-event.svg" alt="icon" />
                  )}
                </div>
                <div className="related-results__cn__item__content">
                  <p className="related-results__cn__item__name">
                    <span>{action.name}</span>
                  </p>
                  <p className="action-type">{action.type || ''}</p>
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>
      <style jsx>
        {`
          .related-results__header {
            display: flex;
            justify-content: space-between;
            align-items: center;
          }

          .center {
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
          }

          .action-type {
            font-size: 12px;
            text-transform: capitalize;
            width: fit-content;
            color: #0f172a;
            font-weight: 500;
            line-height: 20px;
          }
          .related-results {
            border: 1px solid #e2e8f0;
            width: 100%;
            background-color: #f5fafb;
            padding: 12px 10px;
            border-radius: 8px;
          }
          .related-results__title {
            font-size: 14px;
            font-weight: 500;
            color: #ff820e;
            height: 36px;
            display: flex;
            gap: 4px;
            align-items: center;
            line-height: 20px;
          }
          .related-results__cn {
            width: 100%;
            display: grid;
            gap: 10px;
            grid-template-columns: repeat(1, minmax(0, 1fr));
            margin-top: 10px;
          }
          .related-results__cn__item {
            background: #fff;
            //height: 88px;
            padding: 16px;
            border-radius: 8px;
            width: 100%;
            display: flex;
            cursor: pointer;
            justify-content: space-between;
            align-items: center;
            border: 1px solid #e2e8f0;
          }

          .related-results__cn__item__content {
            overflow: hidden;
            width: 100%;
          }

          .related-results__cn__item__wrpr {
            display: flex;
            gap: 8px;
            align-items: center;
            width: 100%;
          }

          .related-results__cn__item__name {
            font-size: 14px;
            line-height: 28px;
            font-weight: 600;
            gap: 6px;
            color: #0f172a;
            text-transform: capitalize;
            white-space: nowrap;
            text-overflow: ellipsis;
            overflow: hidden;
            //width: 90%;
            display: block;
          }

          .actions__cn__item__name__iconWrpr {
            width: 40px;
            height: 40px;
          }

          .actions__cn__item__name__icon {
            width: 40px;
            height: 40px;
            margin-bottom: 1px;
            // border-radius: 50%;
          }
          .related-results__cn__item__desc {
            display: -webkit-box;
            -webkit-line-clamp: 3;
            -webkit-box-orient: vertical;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: normal;
            font-size: 13px;
            height: 48px;
          }
          .related-results__cn__item__link {
            background: #156ff7;
            color: white;
            padding: 10px 12px;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 400;
            text-align: center;
            text-transform: capitalize;
          }
          // .related-results__header__show-all {
          //   font-weight: 500;
          //   font-size: 14px;
          //   line-height: 14px;
          //   color: #156ff7;
          //   background: none;
          // }

          @media (min-width: 475px) {
            .related-results__cn {
              grid-template-columns: repeat(2, minmax(0, 1fr));
            }
          }

          @media (min-width: 1024px) {
            .related-results__cn {
              grid-template-columns: repeat(3, minmax(0, 1fr));
            }
          }
        `}
      </style>
    </>
  );
}

export default RelatedResults;
