import { useState } from 'react';
import { EVENTS, RATINGS } from '@/utils/constants';
import TextArea from '@/components/form/text-area';
import HiddenField from '@/components/form/hidden-field';
import { getMemberInfo } from '@/services/members.service';
import { saveFeedback } from '@/services/husky.service';
import { getUserCredentialsInfo } from '@/utils/fetch-wrapper';
import { useHuskyAnalytics } from '@/analytics/husky.analytics';
interface HuskyFeedbackProps {
  onClose: () => void;
  question: string;
  answer: string;
}

const ChatFeedback = (props: HuskyFeedbackProps) => {
  const { onClose, question, answer } = props;
  const [step, setStep] = useState<'form' | 'success' | 'error'>('form');
  const ratings = [...RATINGS];
  const [ratingInfo, setRatingInfo] = useState<{ rating: number; comment: string }>({
    rating: 3,
    comment: '',
  });

  const { trackFeedbackStatus } = useHuskyAnalytics();

  const onRatingClickHandler = (rating: number) => {
    setRatingInfo((prev) => ({ ...prev, rating }));
  };

  const onFeedbackSubmit = async () => {
    try {
      const { newAuthToken, newUserInfo: userInfo } = await getUserCredentialsInfo();
      trackFeedbackStatus('initiated', ratingInfo.rating.toString(), question);

      let payload = {
        rating: ratingInfo.rating,
        comment: ratingInfo.comment,
        prompt: question,
        response: answer,
      } as any;

      if (userInfo) {
        const memberInfo = await getMemberInfo(userInfo.uid);
        const memberDetails = memberInfo.data;
        payload = {
          ...payload,
          name: memberDetails.name,
          email: memberDetails.email,
          team: memberDetails.teamMemberRoles[0]?.teamTitle ?? '',
          directoryId: memberDetails.uid,
        };
      }

      document.dispatchEvent(new CustomEvent(EVENTS.TRIGGER_REGISTER_LOADER, { detail: true }));
      const response = await saveFeedback(newAuthToken, payload);
      if (response.isSaved) {
        trackFeedbackStatus('success', ratingInfo.rating.toString(), question);
        setStep('success');
      } else {
        trackFeedbackStatus('error', ratingInfo.rating.toString(), question);
        setStep('error');
      }
    } catch (error) {
      console.log('Error while sending feedback', error);
      trackFeedbackStatus('error', ratingInfo.rating.toString(), question);
      setStep('error');
    } finally {
      document.dispatchEvent(new CustomEvent(EVENTS.TRIGGER_REGISTER_LOADER, { detail: false }));
    }
  };

  return (
    <>
      {step === 'form' && (
        <div className="feedback" data-testid="feedback-form">
          <div className="feedback__hdr">
            <h6 className="feedback__hdr__ttl">How useful was this response?</h6>
          </div>
          <div className="feedback__body">
            <div className="feedback__body__wrpr">
              <div className="feedback__body__ratingCn">
                {ratings?.map((rating: any, index: number) => (
                  <button
                    type="button"
                    onClick={() => onRatingClickHandler(index + 1)}
                    className={`feedback__body__ratingCn__rating ${ratingInfo?.rating === index + 1 ? 'selected' : ''} `}
                    style={{ backgroundColor: rating.backgroundColor }}
                    key={`${rating.value}+${index}`}
                    data-testid={`rating-button-${index + 1}`}
                  >
                    {rating.value}
                  </button>
                ))}
              </div>
              <div className="feedback__body__ratingInfo">
                <div className="feedback__body__ratingInfo__text">Not Valuable</div>
                <div className="feedback__body__ratingInfo__text">Extremely Valuable</div>
              </div>
              <HiddenField value={ratingInfo?.rating.toString()} defaultValue={'0'} name={`rating`} />
            </div>
            <div className="feedback__body__cmnt">
              <h6 className="feedback__body__cmnt__ttl">Comment (Optional)</h6>
              <div className="feedback__body__cmnt__textarea">
                <TextArea
                  onChange={(e) => setRatingInfo((prev) => ({ ...prev, comment: e.target.value }))}
                  maxLength={1000}
                  placeholder="Enter comments if you have any"
                  isMandatory={false}
                  name={'feedbackComment'}
                  id={'feedbackComment'}
                  data-testid="feedback-comment"
                />
              </div>
            </div>
          </div>
          <div className="feeback__ftr">
            <button type="button" onClick={onClose} className="feeback__ftr__cancelBtn" data-testid="cancel-button">
              Cancel
            </button>
            <button
              onClick={onFeedbackSubmit}
              type="button"
              className="feeback__ftr__submitBtn"
              data-testid="submit-button"
            >
              Submit
            </button>
          </div>
        </div>
      )}
      {step === 'success' && (
        <div className="feedback" data-testid="feedback-success">
          <h3>Thanks for your response</h3>
          <p>Your feedback has been saved successfully</p>
          <div className="feeback__ftr">
            <button
              onClick={onClose}
              type="button"
              className="feeback__ftr__submitBtn"
              data-testid="close-success-button"
            >
              Close
            </button>
          </div>
        </div>
      )}
      {step === 'error' && (
        <div className="feedback" data-testid="feedback-error">
          <p>Something went wrong. Please try again later</p>
          <div className="feeback__ftr">
            <button
              onClick={onClose}
              type="button"
              className="feeback__ftr__submitBtn"
              data-testid="close-error-button"
            >
              Close
            </button>
          </div>
        </div>
      )}
      <style jsx>{`
        .popup {
          width: 100%;
          height: 100%;
          position: absolute;
          background: #b0bde099;
          top: 0;
          left: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 3;
        }

        .feedback {
          display: flex;
          flex-direction: column;
          gap: 10px;
          padding: 24px;
          background: white;
          border-radius: 12px;
        }
        .feedback__hdr__ttl {
          font-size: 24px;
          font-weight: 700;
          line-height: 32px;
          color: #0f172a;
        }

        .selected {
          outline-style: solid;
          outline-width: 2px;
          outline-offset: 0;
          outline-color: #156ff7;
        }

        .feedback__body {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .feedback__body__wrpr {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .feedback__body__ratingCn {
          display: flex;
          gap: 8px;
        }

        .feedback__body__ratingCn__rating {
          flex: 1;
          display: flex;
          align-items: center;
          border-radius: 4px;
          height: 53px;
          font-size: 16px;
          font-weight: 700;
          line-height: 20px;
          justify-content: center;
        }

        .feedback__body__ratingInfo {
          display: flex;
          justify-content: space-between;
        }

        .feedback__body__ratingInfo__text {
          font-size: 13px;
          font-weight: 500;
          line-height: 12px;
          color: #475569;
        }

        .feedback__body__cmnt {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .feedback__body__cmnt__ttl {
          font-size: 14px;
          font-weight: 600;
          line-height: 20px;
          color: #0f172a;
        }

        .feedback__body__cmnt__textarea {
          textarea {
            height: 80px;
          }
        }

        .feeback__ftr {
          display: flex;
          justify-content: end;
          gap: 10px;
          padding: 6px 0px;
        }

        .feeback__ftr__submitBtn {
          background: #156ff7;
          border: 1px solid #cbd5e1;
          box-shadow: 0px 1px 1px 0px #0f172a14;
          height: 40px;
          display: flex;
          align-items: center;
          padding: 0px 24px;
          font-size: 14px;
          font-weight: 500;
          line-height: 20px;
          color: #ffffff;
          border-radius: 8px;
        }

        .feeback__ftr__cancelBtn {
          background: #fff;
          border: 1px solid #cbd5e1;
          box-shadow: 0px 1px 1px 0px #0f172a14;
          height: 40px;
          display: flex;
          align-items: center;
          padding: 0px 24px;
          font-size: 14px;
          font-weight: 500;
          line-height: 20px;
          color: #0f172a;
          border-radius: 8px;
        }

        @media (min-width: 1024px) {
          .feedback {
            width: 656px;
          }
        }
      `}</style>
    </>
  );
};

export default ChatFeedback;
