import Markdown from 'markdown-to-jsx';
import CopyText from '../copy-text';
import HuskyCodeBlock from './husky-code-block';

interface HuskyChatAnswerProps {
  mode: 'blog' | 'chat';
  answer: string;
  isLastIndex: boolean;
  question: string;
  onQuestionEdit: (ques: string) => void;
  onFeedback: (ques: string, answer: string) => Promise<void>;
  onRegenerate: (ques: string) => Promise<void>;
  onCopyAnswer: (answer: string) => Promise<void>;
}
function HuskyChatAnswer({ mode, answer, isLastIndex, question, onCopyAnswer, onQuestionEdit, onRegenerate, onFeedback }: HuskyChatAnswerProps) {
  const anchorWrapper = (props: any) => (
    <a style={{ color: 'blue' }} target="_blank" href={props.href}>
      {props.children}
    </a>
  );

  const onFeedbackClicked = async () => {
    await onFeedback(question, answer);
  };

  return (
    <>
      <div className="chat__ans">
        {mode !== 'blog' && (
          <h3 className="chat__ans__title">
            <img alt="Answer" width={16} height={16} src="/icons/chat-orange.svg" />
            <span>Answer</span>
          </h3>
        )}
        <div className={`chat__ans__text ${mode === 'blog' ? 'chat__ans__text--blog' : ''}`}>
          <Markdown
            style={{ width: '100%' }}
            options={{
              overrides: {
                a: { component: anchorWrapper },
                p: { props: { style: { marginBottom: '6px', lineHeight: '20px', fontSize: '14px', maxWidth: '100%' } } },
                h1: { props: { style: { marginTop: '14px', marginBottom: '14px', fontSize: '22px' } } },
                h2: { props: { style: { marginTop: '12px', marginBottom: '12px', fontSize: '20px' } } },
                h3: { props: { style: { marginTop: '10px', marginBottom: '10px', fontSize: '18px' } } },
                h4: { props: { style: { marginTop: '8px', marginBottom: '8px', fontSize: '16px' } } },
                ol: { props: { style: { marginLeft: '16px' } } },
                ul: { props: { style: { marginLeft: '16px' } } },
                code: { component: HuskyCodeBlock },
              },
            }}
          >
            {answer}
          </Markdown>
        </div>
        {mode !== 'blog' && (
          <div className="chat__ansactions">
            <div className={`chat__ansactions__cn`}>
              {isLastIndex && <img onClick={async () => await onRegenerate(question)} className="chat__ansactions__cn__item" title="regenerate response" src="/icons/refresh-circle.svg" />}
              {isLastIndex && <img onClick={() => onQuestionEdit(question)} className="chat__ansactions__cn__item" title="edit question" src="/icons/edit-chat.svg" />}
              <CopyText onCopyCallback={onCopyAnswer} textToCopy={answer}>
                {' '}
                <img className="chat__ansactions__cn__item--copy" title="copy response" src="/icons/copy.svg" />
              </CopyText>
              <img className="chat__ansactions__cn__item" title="Submit feedback" onClick={onFeedbackClicked} src="/icons/feedback.svg" />
            </div>
          </div>
        )}
      </div>

      <style jsx>
        {`
          .chat__ans {
            font-size: 14px;
            font-weight: 400;
            line-height: 20px;
            display: flex;
            flex-direction: column;
            gap: 16px;
            border-radius: 8px;
            width: 100%;
          }
          .feeback {
            width: 100%;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            background: none;
            border: none;
          }
          .chat__ans__text {
            font-size: 14px;
            line-height: 26px;
            background: #f1f5f9;
            display: flex;
            gap: 8px;
            padding: 14px;
            border-radius: 8px;
            max-width: 100%;
          }

          .chat__ans__text div:first-child {
            max-width: 100%;
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
          .chat__ansactions {
            height: 42px;
            display: flex;
            align-items: center;
            justify-content: space-between;
          }

          .chat__ansactions__cn {
            display: flex;
            gap: 16px;
            align-items: center;
          }
          .chat__ansactions__cn__item {
            cursor: pointer;
          }

          .chat__ansactions__cn__item--copy {
            margin-top: 4px;
          }
        `}
      </style>
    </>
  );
}

export default HuskyChatAnswer;