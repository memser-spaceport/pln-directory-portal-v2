import { FormEvent, useRef, useState } from 'react';
import Modal from '../modal';
import { RATINGS } from '@/utils/constants';
import TextArea from '@/components/form/text-area';
import HiddenField from '@/components/form/hidden-field';

const FeedbackModal = (props: any) => {
  const feedbackModalRef = props?.modalRef;
  const onClose = props?.onClose;

  const ratings = [...RATINGS];
  const [ratingInfo, setRatingInfo] = useState<any>({
    rating: 0,
    comment: '',
  });
  const [isDisable, setIsDisable] = useState<boolean>(false);
  const feedbackFormRef = useRef<HTMLFormElement>(null);

  const onRatingClickHandler = (rating: number) => {
    setRatingInfo({ ...ratingInfo, rating });
  };

  const onFormSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!feedbackFormRef.current) {
      return;
    }
    const formData = new FormData(feedbackFormRef.current);
    for (let [key, value] of formData.entries()) {
      console.log(`${key}: ${value}`);
    }
    // const formattedData = transformObject(Object.fromEntries(formData));
  };

  return (
    <>
      <Modal modalRef={feedbackModalRef} onClose={onClose}>
        <form ref={feedbackFormRef} onSubmit={onFormSubmit}>
          <div className="feedback">
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
                      style={{ backgroundColor: !isDisable ? rating.backgroundColor : rating.disableColor, pointerEvents: !isDisable ? 'auto' : 'none' }}
                      key={`${rating}+${index}`}
                    >
                      {rating.value}
                    </button>
                  ))}
                </div>
                <div className="feedback__body__ratingInfo">
                  <div className="feedback__body__ratingInfo__text">Not Valueable</div>
                  <div className="feedback__body__ratingInfo__text">Extremely Valueable</div>
                </div>
                <HiddenField value={ratingInfo?.rating.toString()} defaultValue={'0'} name={`rating`} />
              </div>
              <div className="feedback__body__cmnt">
                <h6 className="feedback__body__cmnt__ttl">Comment (Optional)</h6>
                <div className="feedback__body__cmnt__textarea">
                  <TextArea maxLength={1000} placeholder="Enter comments if you have any" isMandatory={false} name={'feedbackComment'} id={'feedbackComment'} />
                </div>
              </div>
            </div>
            <div className="feeback__ftr">
              <button type="button" onClick={onClose} className="feeback__ftr__cancelBtn">
                Cancel
              </button>
              <button type="submit" className="feeback__ftr__submitBtn">
                Submit
              </button>
            </div>
          </div>
        </form>
      </Modal>
      <style jsx>{`
        .feedback {
          width: 85vw;
          display: flex;
          flex-direction: column;
          gap: 10px;
          padding: 24px;
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

export default FeedbackModal;
