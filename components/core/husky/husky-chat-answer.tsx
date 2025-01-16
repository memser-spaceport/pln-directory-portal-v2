import Markdown from 'markdown-to-jsx';
import HuskyCodeBlock from './husky-code-block';
import { PopoverDp } from '../popover-dp';
import InfoBox from '@/components/ui/info-box';
import HuskySourceCard from './husky-source-card';

interface HuskyChatAnswerProps {
  mode: 'blog' | 'chat';
  answer: string;
  question: string;
  sources: any[];
}
function HuskyChatAnswer({ mode, answer, sources, question }: HuskyChatAnswerProps) {
  const anchorWrapper = (props: any) => (
    <a style={{ color: 'blue' }} target="_blank" href={props.href}>
      {`[${props.children}]`}
    </a>
  );

  return (
    <>
      <div className="chat__ans">
        {mode !== 'blog' && (
          <div className="chat__ans__hdr">
            {/* <h3 className="chat__ans__title">
              <img alt="Answer" width={16} height={16} src="/icons/chat-orange.svg" />
              <span>Answer</span>
            </h3> */}
            {sources && sources.length > 0 && (
              <PopoverDp.Wrapper>
                <InfoBox info={`${sources.length} source(s)`} imgUrl="/icons/globe-blue.svg" />
                <PopoverDp.Pane position="bottom">
                  <HuskySourceCard sources={sources} />
                </PopoverDp.Pane>
              </PopoverDp.Wrapper>
            )}
          </div>
        )}
        <div className={`chat__ans__text ${mode === 'blog' ? 'chat__ans__text--blog' : ''}`}>
          <Markdown
            style={{ width: '100%' }}
            options={{
              overrides: {
                a: { component: anchorWrapper },
                p: { props: { style: { marginBottom: '6px', lineHeight: '22px', fontSize: '14px', maxWidth: '100%' } } },
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
      </div>

      <style jsx>
        {`
          .chat__ans {
            font-size: 14px;
            font-weight: 400;
            line-height: 20px;
            display: flex;
            flex-direction: column;
            border-radius: 8px;
            width: 100%;
          }

          .chat__ans__hdr {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding-left: 12px;
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
            display: flex;
            gap: 8px;
            padding: 0px 12px 12px 12px;
            border-radius: 8px;
            max-width: 100%;
          }

          .chat__ans__text div:first-child {
            max-width: 100%;
          }

          .chat__ans__text--blog {
            background: white;
          }
        `}
      </style>
    </>
  );
}

export default HuskyChatAnswer;
