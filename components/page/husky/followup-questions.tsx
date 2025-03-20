interface FollowupQuestionsProps {
    followupQuestions: string[];
    onFollowupClicked?: (question: string) => void;
    chatIndex?: number;
    isAnswerLoading: boolean;
    isLoadingObject: boolean;
  }
  
  function FollowupQuestions({ followupQuestions = [], chatIndex = 0, onFollowupClicked, isAnswerLoading, isLoadingObject }: FollowupQuestionsProps) {

    const onQuestionClicked = (question: string) => {
      if (onFollowupClicked) {
        onFollowupClicked(question);
      }
    };
  
    return (
      <>
        <div className="followup-questions" data-testid="followup-questions">
          <h3 className="followup-questions__title" data-testid="followup-questions-title">
            <img width={16} height={16} src="/icons/suggestions-orange.svg" alt="follow up questions" />
            <span>Follow up questions</span>
          </h3>
          <div data-state={isLoadingObject ? 'loading' : ''} className="followup-questions__list" data-testid="followup-questions-list">
            {followupQuestions.map((ques: any, index: number) => (
              <p 
                onClick={() => onQuestionClicked(ques)} 
                key={`${chatIndex}-follow-up-question-${index}`} 
                className="followup-questions__list__item" 
                data-testid={`follow-up-question-${index}`}
              >
                {ques}
              </p>
            ))}
          </div>
        </div>
        <style jsx>
          {`
            .followup-questions {
             width: 100%;
            }
            .followup-questions__title {
              font-size: 14px;
              font-weight: 500;
              color: #ff820e;
              height: 36px;
              display: flex;
              line-height: 20px;
              gap: 4px;
              align-items: center;
            }
            .followup-questions__list {
              display: flex;
              flex-direction: column;
              gap: 8px;
              margin: 12px 0;
            }
            .followup-questions__list__item {
              background: #f1f5f9;
              font-size: 14px;
              font-weight: 400;
              cursor: pointer;
              padding: 8px 14px;
              border-radius: 8px;
              line-height: 22px;
              color: #000;
            }

            .followup-questions__list[data-state="loading"] .followup-questions__list__item {
              pointer-events: none;
              cursor: default;
            }
          `}
        </style>
      </>
    );
  }
  
  export default FollowupQuestions;
  