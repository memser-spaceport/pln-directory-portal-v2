'use client'
import { useState } from 'react';
import HuskyInputBox from './husky-input-box';
import HuskyAsk from './husky-ask';
import HuskyChat from './husy-chat';
import RoundedTabs from '@/components/ui/rounded-tabs';

function HuskyAi() {
  const [mode, setMode] = useState('What can I ask?');

  const onTabSelected = (item: string) => {
    setMode(item);
  };

  return (
    <>
      <div className="huskyai">
        <div className="huskyai__tab">
          <RoundedTabs items={['What can I ask?', 'Exploration']} activeItem={mode} onTabSelected={onTabSelected}/>
        </div>
        <div className="huskyai__selection">
          {mode === 'What can I ask?' && <HuskyAsk />}
          {mode === 'Exploration' && <HuskyChat mode="chat" />}
        </div>
        <div className="huskyai__input">
          <HuskyInputBox />
        </div>
      </div>
      <style jsx>
        {`
          .huskyai {
            width: 100%;
            height: 100%;
            position: relative;
            background: white;
          }
          .huskyai__tab {
            position: absolute;
            width: 100%;
            border-bottom: 1px solid #cbd5e1;
            background: white;
            z-index: 1;
          }
         .huskyai__selection {
            width: 100%;
            height: 100%;
            overflow-y: scroll;
            position: relative;
            padding-top: 48px;
            padding-bottom: 112px;
           
         }
          .huskyai__input {
            width: 100%;
            height: 64px;
            position: sticky;
            background: white;
            bottom: 0;
            border-top: 1px solid #cbd5e1;
          }

          @media (min-width: 1024px) {
          }
        `}
      </style>
    </>
  );
}

export default HuskyAi;
