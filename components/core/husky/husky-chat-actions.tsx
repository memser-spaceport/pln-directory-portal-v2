'use client'

import { useHuskyAnalytics } from "@/analytics/husky.analytics";

interface HuskyChatActionsProps {
  actions: any[];
}
function HuskyChatActions({ actions }: HuskyChatActionsProps) {

  const {trackHuskyActionCardClicked} = useHuskyAnalytics()
  const onActionCardClicked = (action: any) => {
    trackHuskyActionCardClicked(action)
  }
  return (
    <>
      <div className="chat-actions">
        <h3 className="chat-actions__title">
          <img width={16} height={16} src="/icons/husky-brain.svg" />
          <span>Suggested actions</span>
        </h3>
        <div className="chat-actions__cn ">
          {actions.map((action: any) => (
            <a target="_blank" href={action.directoryLink} onClick={() => onActionCardClicked(action)}  className="chat-actions__cn__item" key={action.directoryLink}>
              <div></div>
              <div className="center">
              <p className="chat-actions__cn__item__name">
                <span>{action.name}</span>
              </p>
              <p className="chat-action-type">{`(${action.type})`}</p>
              </div>
              <div></div>
              
             
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
           text-transform: capitalize;
           margin-top: 3px;
           width: fit-content;
          }
          .chat-actions {
            width: 100%;
          }
          .chat-actions__title {
            font-size: 12px;
            font-weight: 500;
            color: #ff820e;
            text-transform: uppercase;
            border-bottom: 1px solid #cbd5e1;
            height: 36px;
            display: flex;
            gap: 4px;
            align-items: center;
          }
          .chat-actions__cn {
            width: 100%;
            display: flex;
            gap: 16px;
            flex-wrap: wrap;
            margin-top: 16px;
          }
          .chat-actions__cn__item {
            background: rgba(241, 245, 249, 1);
            padding: 8px;
            border-radius: 8px;
            width: 100%;
            display: flex;
            flex-direction: column;
            gap: 12px;
            cursor: pointer;
          }
          .chat-actions__cn__item__name {
            font-size: 18px;
            font-weight: 600;
            display: flex;
            gap: 6px;
            align-items: center;
          }

          .actions__cn__item__name__icon {
            width: 17px;
            height: 17px;
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
            font-weight: 500;
            text-align: center;
            text-transform: capitalize;
          }

           @media (min-width: 1024px) {
           
            .chat-actions__cn__item {
              width: 304px;
            }
          }
        `}
      </style>
    </>
  );
}

export default HuskyChatActions;
