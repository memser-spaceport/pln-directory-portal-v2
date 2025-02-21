'use client';

import { useHuskyAnalytics } from '@/analytics/husky.analytics';

interface HuskyChatActionsProps {
  actions: any[];
}
function HuskyChatActions({ actions }: HuskyChatActionsProps) {
  const { trackHuskyActionCardClicked } = useHuskyAnalytics();
  const onActionCardClicked = (action: any) => {
    trackHuskyActionCardClicked(action);
  };
  return (
    <>
      <div className="chat-actions">
        <h3 className="chat-actions__title">
          <img width={16} height={16} src="/icons/husky-brain.svg" />
          <span>Related results</span>
        </h3>
        <div className="chat-actions__cn ">
          {actions.map((action: any, index: number) => (
            <a target="_blank" href={action.directoryLink} onClick={() => onActionCardClicked(action)} className="chat-actions__cn__item" key={index}>
              <div className="chat-actions__cn__item__wrpr">
                <div className="actions__cn__item__name__iconWrpr">
                  {action.type?.toLowerCase() === 'member' && <img className="actions__cn__item__name__icon" src="/icons/default_profile.svg" alt="icon" />}
                  {action.type?.toLowerCase() === 'team' && <img className="actions__cn__item__name__icon" src="/icons/team-default-profile.svg" alt="icon" />}
                  {action.type?.toLowerCase() === 'project' && <img className="actions__cn__item__name__icon" src="/icons/default-project.svg" alt="icon" />}
                  {action.type?.toLowerCase() === 'event' && <img className="actions__cn__item__name__icon" src="/icons/irl-event-default-logo.svg" alt="icon" />}
                </div>
                <div className="">
                  <p className="chat-actions__cn__item__name">
                    <span>{action.name}</span>
                  </p>
                  <p className="chat-action-type">{action.type || ''}</p>
                </div>
              </div>
              <img height={20} width={20} src="/icons/open-link.svg" alt="arrow" />
            </a>
          ))}
        </div>
      </div>
      <style jsx>
        {`
          .center {
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
          }

          .chat-action-type {
            font-size: 14px;
            text-transform: capitalize;
            margin-top: 3px;
            width: fit-content;
            color: #64748b;
            font-weight: 400;
            min-height: 17px;
          }
          .chat-actions {
            width: 100%;
          }
          .chat-actions__title {
            font-size: 12px;
            font-weight: 500;
            color: #ff820e;
            text-transform: uppercase;
            border-bottom: 0.5px solid #cbd5e1;
            height: 36px;
            display: flex;
            gap: 4px;
            align-items: center;
          }
          .chat-actions__cn {
            width: 100%;
            display: grid;
            gap: 16px;
            grid-template-columns: repeat(1, minmax(0, 1fr));
            margin-top: 16px;
          }
          .chat-actions__cn__item {
            background: rgba(241, 245, 249, 1);
            padding: 8px;
            border-radius: 8px;
            width: 100%;
            display: flex;
            cursor: pointer;
            justify-content: space-between;
            align-items: center;
          }

          .chat-actions__cn__item__wrpr {
            display: flex;
            gap: 12px;
            align-items: center;
          }

          .chat-actions__cn__item__name {
            font-size: 14px;
            min-height: 17px;
            font-weight: 400;
            display: flex;
            gap: 6px;
          }

          .actions__cn__item__name__iconWrpr {
            width: 32px;
            height: 32px;
          }

          .actions__cn__item__name__icon {
            width: 32px;
            height: 32px;
            margin-bottom: 1px;
            border-radius: 50%;
          }
          .chat-actions__cn__item__desc {
            display: -webkit-box;
            -webkit-line-clamp: 3;
            -webkit-box-orient: vertical;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: normal;
            font-size: 13px;
            height: 48px;
          }
          .chat-actions__cn__item__link {
            background: #156ff7;
            color: white;
            padding: 10px 12px;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 400;
            text-align: center;
            text-transform: capitalize;
          }

          @media (min-width: 475px) {
            .chat-actions__cn {
              grid-template-columns: repeat(2, minmax(0, 1fr));
            }
          }

          @media (min-width: 1024px) {
            .chat-actions__cn {
              grid-template-columns: repeat(3, minmax(0, 1fr));
            }
          }
        `}
      </style>
    </>
  );
}

export default HuskyChatActions;
