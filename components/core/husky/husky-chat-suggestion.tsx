// This component renders follow-up questions as suggestions in a chat interface.
// It allows users to click on a question to trigger a follow-up action.

interface HuskyChatSuggestionsProps {
  followupQuestions: string[];
  onFollowupClicked?: (question: string) => Promise<void>;
  chatIndex?: number;
  isAnswerLoading: boolean;
}

function HuskyChatSuggestions({ followupQuestions = [], chatIndex = 0, onFollowupClicked, isAnswerLoading }: HuskyChatSuggestionsProps) {
  // Handles the click event for a follow-up question.
  // If an answer is loading, it prevents further actions.
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
      <div className="chat__suggestions" data-testid="chat-suggestions">
        <h3 className="chat__suggestions__title" data-testid="suggestions-title">
          <img width={16} height={16} src="/icons/suggestions-orange.svg" alt="follow up questions" />
          <span>Follow up questions</span>
        </h3>
        <div className="chat__suggestions__list" data-testid="suggestions-list">
          {followupQuestions.map((ques: any, index: number) => (
            <p 
              onClick={() => onQuestionClicked(ques)} 
              key={`${chatIndex}-follow-up-question-${index}`} 
              className="chat__suggestions__list__item" 
              data-testid={`follow-up-question-${index}`}
            >
              {ques}
            </p>
          ))}
        </div>
      </div>
      <style jsx>
        {`
          .chat__suggestions {
           width: 100%;
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
