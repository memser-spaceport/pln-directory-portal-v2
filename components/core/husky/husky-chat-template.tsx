'use client'
import BarTabs from '@/components/ui/bar-tabs';
import InfoBox from '@/components/ui/info-box';
import Markdown from 'markdown-to-jsx';
import { useState } from 'react';
import { PopoverDp } from '../popover-dp';
import HuskySourceCard from './husky-source-card';
interface HuskychatTemplateProps {
  mode: 'blog' | 'chat',
  chatInfo: any
}
function HuskychatTemplate({mode, chatInfo}: HuskychatTemplateProps) {

  return (
    <>
      <div className="chat">
        <div className="chat__ques">
          <h2 className="chat__ques">{chatInfo.question}</h2>
          <div className="chat__quesactions">
            <div className="chat__quesactions__cn">
              <PopoverDp.Wrapper>
                <InfoBox info="5 Sources" imgUrl="/icons/globe-blue.svg" />
                <PopoverDp.Pane position="bottom">
                  <HuskySourceCard/>
                </PopoverDp.Pane>
              </PopoverDp.Wrapper>
              <InfoBox info="Share" imgUrl="/icons/share-blue.svg" moreInfo="5" />
            </div>
            <div className="chat__quesactions__cn">
              <div className="chat__quesactions__cn__view">
                <img src="/icons/view-icon.svg" />
                <p>399</p>
              </div>
            </div>
          </div>
        </div>
        <div className="chat__ans">
         {mode !== 'blog' &&  <h3 className="chat__ans__title">
            <img width={16} height={16}  src="/icons/chat-orange.svg" />
            <span>Answer</span>
          </h3>}
          <div className={`chat__ans__text ${mode === 'blog' ? 'chat__ans__text--blog': ''}`}>
            <Markdown>
             {chatInfo.answer}
            </Markdown>
          </div>
          <div className="chat__ansactions">
            <div className={`chat__ansactions__cn`}>
              <img src="/icons/thumbs-up-blue.svg" />
              <img src="/icons/line.svg" />
              <img src="/icons/thumbs-down-blue.svg" />
              <img src="/icons/line.svg" />
              <img src="/icons/copy.svg" />
            </div>
            <div className="chat__ansactions__cn">
              <img src="/icons/refresh-circle.svg" />
              <img src="/icons/line.svg" />
              <img src="/icons/edit-chat.svg" />
            </div>
          </div>
        </div>

        <div className="chat__suggestions">
          <h3 className="chat__suggestions__title">
            <img width={16} height={16} src="/icons/suggestions-orange.svg" />
            <span>Follow up questions</span>
          </h3>
          <div className="chat__suggestions__list">
            <p className="chat__suggestions__list__item">How do I apply to speak at a Filcoin event?</p>
            <p className="chat__suggestions__list__item">Are there any virtual events in the Filecoin community?</p>
            <p className="chat__suggestions__list__item">Who are the main sponsors for FIL Brussels?</p>
          </div>
        </div>
      </div>
      <style jsx>
        {`
          .sources {
            width: 327px;
            display: flex;
            flex-direction: column;
            gap: 8px;
            margin: 24px;
          }
          .sources__title {
            padding-bottom: 8px;
          }
          .sources__item {
            padding: 8px 10px;
            border: 1px solid #e2e8f0;
            border-radius: 4px;
            display: flex;
            flex-direction: column;
            gap: 12px;
          }
          .sources__item__head {
            display: flex;
            gap: 4px;
          }
          .chat {
            display: flex;
            flex-direction: column;
            gap: 24px;
          }
          .chat__ques {
            display: flex;
            flex-direction: column;
            gap: 16px;
          }
          .chat__ques__title {
            font-size: 22px;
            line-height: 30px;
            font-weight: 400;
          }
          .chat__quesactions {
            width: 100%;
            height: 22px;
            display: flex;
            align-items: center;
            justify-content: space-between;
          }
          .chat__ans {
            font-size: 14px;
            font-weight: 400;
            line-height: 20px;
            display: flex;
            flex-direction: column;
            gap: 16px;
            border-radius: 8px;
          }
          .chat__ans__text {
            font-size: 14px;
            line-height: 26px;
            background: #f1f5f9;
            display: flex;
            gap: 8px;
            padding: 14px;
            border-radius: 8px;
          }
          
          .chat__ans__text--blog {
            background: white;
            padding: 14px 0;
          }

          .chat__ans__title {
            font-size: 12px;
            font-weight: 500;
            color: #ff820e;
            text-transform: uppercase;
            border-bottom: 1px solid #cbd5e1;
            height: 36px;
            display: flex;
            align-items: center;
            gap: 4px;
          }
          .chat__suggestions {
            height: 36px;
            padding-bottom: 150px;
          }
          .chat__suggestions__title {
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
          .chat__suggestions__list {
            display: flex;
            flex-direction: column;
            gap: 8px;
            margin: 12px 0;
          }
          .chat__suggestions__list__item {
            background: #f1f5f9;
            font-size: 14px;
            font-weight: 400;
            padding: 8px 14px;
          }
          .chat__quesactions__cn {
            display: flex;
            gap: 8px;
          }
          .chat__quesactions__cn__view {
            display: flex;
            gap: 4px;
            color: #475569;
            font-size: 14px;
          }

          .chat__ansactions {
            height: 42px;
            display: flex;
            align-items: center;
            justify-content: space-between;
          }

          .chat__ansactions__cn {
            display: flex;
            gap: 16px;
          }
        `}
      </style>
    </>
  );
}

export default HuskychatTemplate;
