import { useRef, useState } from 'react';

function HuskyChat() {
  const [mode, setMode] = useState('chat');
  const [suggestionTopicSelected, setSuggestionTopic] = useState('teams');
  const [selectedAction, setSuggestedAction] = useState('prompts');
  const prompts = ['How do I apply to speak at a Filcoin event?', 'Are there any virtual events in the Filecoin community?', 'Who are the main sponsors for FIL Brussels?'];
  const suggestionTopics = [
    { name: 'TEAMS', key: 'teams', icon: '' },
    { name: 'PROJECTS', key: 'projects', icon: '' },
    { name: 'IRL GATHERINGS', key: 'irl', icon: '' },
  ];
  const actions = [{ name: 'Suggested Prompts', key: 'prompts', icon: '' }];
  const onTabSelected = (item: string) => {
    setMode(item);
  };

  const [inputText, setInputText] = useState('');
  const textAreaRef = useRef<HTMLTextAreaElement | null>(null);
  const onTextChange = (e: any) => {
    setInputText(e.target.value);
    if (textAreaRef.current) {
      const lines = textAreaRef.current.scrollHeight / 16;
      console.log(lines, textAreaRef.current.scrollHeight);
    }
  };
  return (
    <>
      <div className="hc">
        <div className="hc__tab">
          <p className={`hc__tab__item ${mode === 'ask' ? 'hc__tab__item--active' : ''}`} onClick={() => onTabSelected('ask')}>
            What can I ask?
          </p>
          <p className={`hc__tab__item ${mode === 'chat' ? 'hc__tab__item--active' : ''}`} onClick={() => onTabSelected('chat')}>
            My Chat
          </p>
        </div>
        {mode === 'ask' && (
          <div className="hc__ask">
            <div className="hc__ask__info">
              Husky's fetching capacities is currently limited to the data from the following teams, projects and events today. You may not get appropriate responses if anything beyond this scope is
              requested.
            </div>
            <div className="hc__ask__st">
              <div className="hc__ask__st__tab">
                {suggestionTopics.map((topic) => (
                  <p className="hc__ask__st__tab__item" key={`${topic.key}`}>
                    {topic.name}
                  </p>
                ))}
              </div>
              <div className="hc__ask__st__list">
                <div className="hc__ask__st__list__content"></div>
                <div className="hc__ask__st__list__info">
                  <p>Want Husky to be able to fetch results for your teams, projects and members too?</p>
                  <button>Enroll your team</button>
                </div>
              </div>
            </div>
            <div className="hc__ask__sp">
              <div className="hc__ask__sp__tab">
                {actions.map((action) => (
                  <p className="hc__ask__sp__tab__item" key={`${action.key}`}>
                    {action.name}
                  </p>
                ))}
              </div>
              <div className="hc__ask__sp__content">
                {selectedAction === 'prompts' && (
                  <div className="hc__ask__sp__content__list">
                    {prompts.map((prompt) => (
                      <p className="hc__ask__sp__content__list__item">{prompt}</p>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        {mode === 'chat' && (
          <div className="hc__chat">
            <div className="hc__chat__threads">
              <p>Chat content</p>
            </div>
          </div>
        )}
        <div className="hc__chat__input">
          <div>
            <div contentEditable={true} className="hc__chat__input__item" onChange={onTextChange}></div>
          </div>
        </div>
      </div>
      <style jsx>
        {`
          .hc {
            width: 100%;
            height: 100%;
            position: relative;
            background: white;
          }
          .hc__tab {
            position: absolute;
            width: 100%;
            height: 48px;
            border-bottom: 1px solid #cbd5e1;
            display: flex;
            align-items: center;
            justify-content: flex-start;
            gap: 16px;
            padding: 0 16px;
            background: white;
            z-index: 1;
          }
          .hc__tab__item {
            font-size: 12px;
            font-weight: 400;
            padding: 4px 12px;
            border: 1px solid #e2e8f0;
            border-radius: 43px;
            background: white;
            color: black;
            cursor: pointer;
          }

          .hc__tab__item--active {
            background: #156ff7;
            color: white;
          }
          .hc__ask {
            width: 100%;
            padding-top: 48px;
            height: 100%;
            padding-bottom: 72px;
            overflow-y: scroll;
          }

          .hc__ask__info {
            font-size: 14px;
            line-height: 24px;
            padding: 12px 14px;
          }

          .hc__ask__st {
            width: 100%;
          }
          .hc__ask__st__tab {
            height: 36px;
            width: 100%;
            display: flex;
            align-items: center;
            border-bottom: 1px solid #cbd5e1;
            border-top: 1px solid #cbd5e1;
          }
          .hc__ask__st__tab__item {
            padding: 8px 12px;
            font-size: 12px;
            font-weight: 500;
          }

          .hc__ask__sp {
            width: 100%;
          }
          .hc__ask__sp__content {
            padding: 16px;
          }
          .hc__ask__sp__content__list {
            display: flex;
            flex-direction: column;
            gap: 8px;
          }
          .hc__ask__sp__content__list__item {
            padding: 8px 14px;
            background: #f1f5f9;
            font-size: 14px;
            border-radius: 8px;
          }
          .hc__ask__sp__tab {
            height: 36px;
            width: 100%;
            display: flex;
            align-items: center;
            border-bottom: 1px solid #cbd5e1;
            border-top: 1px solid #cbd5e1;
          }
          .hc__ask__sp__tab__item {
            padding: 8px 12px;
            font-size: 12px;
            font-weight: 500;
          }
          .hc__ask__st__list {
            padding: 16px;
            height: 310px;
            display: flex;
            gap: 8px;
          }
          .hc__ask__st__list__content {
            height: 100%;
            overflow-y: scroll;
            width: 180px;
            border: 1px solid grey;
            flex: 1;
          }

          .hc__ask__st__list__info {
            flex: 1;
            background: #f1f5f9;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 16px;
            text-align: center;
            font-size: 12px;
            line-height: 18px;
            font-weight: 400;
            gap: 20px;
          }

          .hc__chat {
            width: 100%;
            height: 100%;
            overflow-y: scroll;
            position: relative;
            padding-top: 48px;
            padding-bottom: 72px;
          }
          .hc__chat__threads {
            width: 100%;
            height: 800px;
          }
          .hc__chat__input {
            width: 100%;
            height: 64px;
            position: sticky;
            background: white;
            bottom: 0;
            border-top: 1px solid #cbd5e1;
            overflow: hidden;
          }
          .hc__chat__input__item {
            border: none;
            outline: none;
            height: 64px;
            font-size: 16px;
            line-height: 18px;
            width: 100%;
            max-height: 64px;
            overflow-y:auto;
          }

          .wrap {
            position: relative;
            width: 100%;
          }

          .hc__chat__input__hidden {
            visibility: hidden;
            white-space: pre-wrap;
            word-wrap: break-word;
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            width: 100%;
            height: 16px;
            overflow-y: scroll;
          }

          @media (min-width: 1024px) {
            .hc__ask__st__list__content {
              width: 285px;
            }
          }
        `}
      </style>
    </>
  );
}

export default HuskyChat;
