import InfoBox from "@/components/ui/info-box";
import { PopoverDp } from "../popover-dp";
import HuskySourceCard from "./husky-source-card";
import CopyText from "../copy-text";

interface HuskyChatQuestion {
    question: string,
    shareCount?:number,
    viewCount?: number,
    blogId?: string,
    onShareClicked?: () => Promise<void>
    sources: any[]
}
function HuskyChatQuestion({question, shareCount, viewCount, sources, onShareClicked, blogId}: HuskyChatQuestion) {
  return (
    <>
      <div className="chat__ques">
        <h2 className="chat__ques">{question}</h2>
        {((sources && sources.length > 0) || viewCount || shareCount) && <div className="chat__quesactions">
          <div className="chat__quesactions__cn">
            {(sources && sources.length > 0) &&  <PopoverDp.Wrapper>
              <InfoBox info={`${sources.length} source(s)`} imgUrl="/icons/globe-blue.svg" />
              <PopoverDp.Pane position="bottom">
                <HuskySourceCard sources={sources}/>
              </PopoverDp.Pane>
            </PopoverDp.Wrapper>}
            {shareCount && <CopyText onCopyCallback={onShareClicked} textToCopy={`${window.location.protocol}//${window.location.host}?showmodal=husky&discoverid=${blogId}`}><InfoBox info="Share" imgUrl="/icons/share-blue.svg" moreInfo={`${shareCount}`} /></CopyText>}
          </div>
          {viewCount && <div className="chat__quesactions__cn">
            <div className="chat__quesactions__cn__view">
              <img src="/icons/view-icon.svg" />
              <p>{viewCount}</p>
            </div>
          </div>}
        </div>}
      </div>
      <style jsx>
        {`
          .chat__ques {
            display: flex;
            flex-direction: column;
            gap: 16px;
            width: 100%;
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
        `}
      </style>
    </>
  );
}

export default HuskyChatQuestion;
