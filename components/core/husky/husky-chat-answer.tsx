import Markdown from 'markdown-to-jsx';

interface HuskyChatAnswerProps {
  mode: 'blog' | 'chat';
  answer: string;
}
function HuskyChatAnswer({ mode, answer }: HuskyChatAnswerProps) {
  const anchorWrapper = (props: any) => <a style={{color: 'blue'}} target='_blank' href={props.href}>{`[`}{props.children}{`]`}</a>
 return (
    <>
      <div className="chat__ans">
        {mode !== 'blog' && (
          <h3 className="chat__ans__title">
            <img width={16} height={16} src="/icons/chat-orange.svg" />
            <span>Answer</span>
          </h3>
        )}
        <div className={`chat__ans__text ${mode === 'blog' ? 'chat__ans__text--blog' : ''}`}>
          <Markdown options={{ overrides: { a: { component: anchorWrapper }, ol: { props: {style: {'marginLeft': '16px'}}},  ul: { props: {style: {'marginLeft': '16px'}}} } }}>{answer}</Markdown>
        </div>
        {mode !== 'blog' && (
          <div className="chat__ansactions">
            <div className={`chat__ansactions__cn`}>
              <img src="/icons/refresh-circle.svg" />
              <img src="/icons/line.svg" />
              <img src="/icons/edit-chat.svg" />
              <img src="/icons/line.svg" />
              <img src="/icons/copy.svg" />
            </div>
          </div>
        )}
      </div>

      <style jsx>
        {`
          .anchor {
           color: green;
          }
          a {
           color: red;
          }
          [data-type='link'] {
            color: blue;
          }
          [data-type='link']::before {
            content: '[';
          }
          [data-type='link']::after {
            content: ']';
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

export default HuskyChatAnswer;
