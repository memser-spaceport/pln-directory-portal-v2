import s from './FollowupQuestions.module.scss';

interface Props {
  followupQuestions: string[];
  onFollowupClicked?: (question: string) => void;
  isLoadingObject: boolean;
}

export function FollowupQuestions(props: Props) {
  const { followupQuestions, onFollowupClicked, isLoadingObject } = props;

  return (
    <div className={s.root} data-testid="followup-questions">
      <h3 className={s.title} data-testid="followup-questions-title">
        <img width={16} height={16} src="/icons/suggestions-orange.svg" alt="follow up questions" />
        <span>Follow up questions</span>
      </h3>
      <div data-state={isLoadingObject ? 'loading' : ''} className={s.list} data-testid="followup-questions-list">
        {followupQuestions.map((question, index) => (
          <p
            onClick={() => onFollowupClicked?.(question)}
            key={index}
            className={s.item}
            data-testid={`follow-up-question-${index}`}
          >
            {question}
          </p>
        ))}
      </div>
    </div>
  );
}
