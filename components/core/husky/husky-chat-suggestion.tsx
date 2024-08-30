interface HuskyChatSuggestionsProps {
  followupQuestions: string[];
  onFollowupClicked?: (question: string) => Promise<void>;
  chatIndex?: number;
  isAnswerLoading: boolean;
}
function HuskyChatSuggestions({ followupQuestions = [], chatIndex = 0, onFollowupClicked, isAnswerLoading }: HuskyChatSuggestionsProps) {
  const onQuestionClicked = (question: string) => {
    if(isAnswerLoading) {
      return;
    }
    if (onFollowupClicked) {
      onFollowupClicked(question)
        .then()
        .catch((e) => console.error(e));
    }
  };
  return (
    <>
      <div className="chat__suggestions">
        <h3 className="chat__suggestions__title">
          <img width={16} height={16} src="/icons/suggestions-orange.svg" />
          <span>Follow up questions</span>
        </h3>
        <div className="chat__suggestions__list">
          {followupQuestions.map((ques: any, index: number) => (
            <p onClick={() => onQuestionClicked(ques)} key={`${chatIndex}-follow-up-question-${index}`} className="chat__suggestions__list__item">
              {ques}
            </p>
          ))}
        </div>
      </div>
      <style jsx>
        {`
          .chat__suggestions {
           
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
            cursor: pointer;
            padding: 8px 14px;
          }
        `}
      </style>
    </>
  );
}

export default HuskyChatSuggestions;
