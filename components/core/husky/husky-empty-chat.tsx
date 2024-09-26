import { useHuskyAnalytics } from '@/analytics/husky.analytics';
import { useState, useRef } from 'react';

interface HuskyEmptyChatProps {
  onPromptClicked: (ques: string) => Promise<void>;
}

function HuskyEmptyChat({ onPromptClicked }: HuskyEmptyChatProps) {
  const initialPrompts = [
    { text: 'Summary of discussions from the LabWeek Field Building sessions?', icon: '/icons/send-black.svg' },
    { text: 'Recent updates from the Filecoin ecosystem?', icon: '/icons/send-black.svg' },
    { text: 'What are some of the trending network updates from the Protocol Labs?', icon: '/icons/send-black.svg' },
  ];

  const { trackExplorationPromptSelection } = useHuskyAnalytics();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handlePromptSubmission = async () => {
    const trimmedValue = textareaRef.current?.value.trim();
    if (!trimmedValue) {
      textareaRef.current?.setAttribute('placeholder', 'Go ahead, ask anything below');
      return;
    }
    await onPromptClicked(trimmedValue);
    if (textareaRef.current) {
      textareaRef.current.value = ''; // Clear the textarea
      textareaRef.current.setAttribute('placeholder', 'Go ahead, ask anything below');
    }
  };

  const onExplorationPromptClicked = async (ques: string) => {
    trackExplorationPromptSelection(ques);
    await onPromptClicked(ques);
  };

  return (
    <>
      <div className="hec">
        <div className="hec__info">
          <div className="hec__info__title">
            <img src="/icons/husky-bone-blue.svg" className="hec__info__title__icon" />
            <h3 className="hec__info__title__text">What is Husky?</h3>
          </div>
          <p className="hec__info__desc">
            HuskyAI is an LLM-powered chatbot, designed to help you explore Protocol Labs teams, projects, events and members. HuskyAI can make suggestions and recommendations based on what you’re
            looking for. While it’s currently trained on a limited set of Protocol Labs entities, we encourage you to upload data about your team, project, or yourself to help others across our
            growing innovation network discover and explore what you’re working on.
          </p>
        </div>
        <div className="hec__content">
          <div className="hec__content__background">
            <img className="hec__content__background__logo" src="/images/husky-line-logo.svg" />
          </div>
          <h3 className="hec__content__title">Traverse the Protocol Labs with Husky</h3>
          <div className="hec__content__box">
            <div className="hec__content__box__search">
              <img className="hec__content__box__search__icon" width={30} height={30} src="/images/husky-brain.png" />
              <textarea ref={textareaRef} className="hec__content__box__search__input" placeholder="Go ahead, ask anything below" />
              <button onClick={handlePromptSubmission} className="hec__content__box__search__button">
                <img src="/icons/send.svg" />
              </button>
            </div>
            <div className="hec__content__box__prompts">
              <h4 className="hec__content__box__prompts__title">
                <img src="/icons/suggestions-orange.svg" className="hec__content__box__prompts__title__icon" />
                <span className="hec__content__box__prompts__title__text">Try asking or searching for</span>
              </h4>
              <div className="hec__content__box__prompts__list">
                {initialPrompts.map((prompt, index) => (
                  <div className="hec__content__box__prompts__list__item" key={index} onClick={() => onExplorationPromptClicked(prompt.text)}>
                    <img src={prompt.icon} className="hec__content__box__prompts__list__item__icon" />
                    <span className="hec__content__box__prompts__list__item__text">{prompt.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="hec__content__footer">
            <img width={16} height={16} src="/icons/husky-add.svg" className="hec__content__footer__icon" />
            <p className="hec__content__footer__text">Want Husky to be able to fetch results for your teams, projects and members too?</p>
            <a href='https://airtable.com/appgb6O7eF6mBEl8t/pagkXZKMaDujXVdio/form' target='_blank' className="hec__content__footer__button">Upload data</a>
          </div>
        </div>
      </div>
      <style jsx>{`
        .hec {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }
        .hec__info {
          display: flex;
          flex-direction: column;
          gap: 12px;
          padding: 12px 24px;
          border-bottom: 1px solid #cbd5e1;
        }
        .hec__content {
          display: flex;
          flex-direction: column;
          gap: 12px;
          justify-content: center;
          align-items: center;
          position: relative;
        }
        .hec__content__background {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          display: flex;
          justify-content: center;
          align-items: center;
          padding-top: 0px;
        }
        .hec__content__background__logo {
          width: 90%;
          height: auto;
        }
        .hec__content__footer {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 20px 16px;
          background-color: #f1f5f9;
          border-radius: 8px;
          width: calc(100% - 32px);
          margin-top: -16px;
          z-index: 1;
        }
        .hec__content__footer__text {
          font-size: 12px;
          font-weight: 400;
          line-height: 16px;
          flex: 1;
        }
        .hec__content__footer__button {
          color: #156ff7;
          outline: none;
          border: none;
          cursor: pointer;
          font-size: 12px;
          font-weight: 400;
          line-height: 16px;
          width: auto;
          background-color: transparent;
        }
        .hec__content__box {
          display: flex;
          flex-direction: column;
          border-radius: 8px;
          box-shadow: 0px 0px 6px 0px rgba(0, 0, 0, 0.14);
          background-color: #fff;
          z-index: 2;
          margin: 0 16px;
        }
        .hec__content__box__search {
          height: 64px;
          border-bottom: 1px solid #cbd5e1;
          width: 100%;
          display: flex;
          align-items: center;
          padding: 0 16px;
          gap: 8px;
        }
        .hec__content__box__search__input {
          flex: 1;
          border: none;
          outline: none;
          font-size: 13px;
          resize: none;
          height: 40px;
          padding: 6px 0;
        }

        .hec__content__box__search__icon {
          padding-top: 2px;
        }
        .hec__content__box__search__button {
          width: 40px;
          height: 40px;
          background: #156ff7;
          font-size: 16px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 4px;
          padding-right: 2px;
        }
        .hec__content__title {
          font-size: 22px;
          font-weight: 500;
          color: #1e3a8a;
          line-height: 28px;
          width: 90%;
          text-align: center;
          z-index: 1;
          margin: 0px 0;
        }
        .hec__info__title {
          display: flex;
          gap: 6px;
          align-items: center;
          font-size: 16px;
          font-weight: 500;
          color: #156ff7;
        }
        .hec__info__desc {
          font-size: 12px;
          font-weight: 400;
          color: #1e3a8a;
          line-height: 20px;
        }
        .hec__content__box__prompts {
          display: flex;
          flex-direction: column;
          gap: 8px;
          padding: 16px;
        }
        .hec__content__box__prompts__title {
          display: flex;
          gap: 6px;
          align-items: center;
          font-size: 13px;
          font-weight: 400;
          color: #0f172a;
        }
        .hec__content__box__prompts__list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .hec__content__box__prompts__list__item {
          display: flex;
          gap: 8px;
          align-items: center;
          cursor: pointer;
          color: #156ff7;
          font-size: 13px;
          font-weight: 400;
        }

        @media (min-width: 1024px) {
          .hec__content__box {
            width: 600px;
          }
          .hec__content__footer {
            width: 600px;
          }
          .hec__content__background__logo {
            width: 400px;
            height: auto;
          }
          .hec__content__box__search__input {
            font-size: 16px;
            padding: 10px 0;
          }
          .hec__content__title {
            width: 380px;
            font-size: 28px;
            margin: 30px 0;
            line-height: 36px;
          }
        }
      `}</style>
    </>
  );
}

export default HuskyEmptyChat;
