import HiddenField from '@/components/form/hidden-field';
import TextArea from '@/components/form/text-area';
import { createFeedBack } from '@/services/office-hours.service';
import { EVENTS, FEEDBACK_RESPONSE_TYPES, RATINGS, TOAST_MESSAGES } from '@/utils/constants';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import TroubleSection from './trouble-section';

const Happened = (props: any) => {
  const onClose = props?.onClose;
  const currentFollowup = props?.currentFollowup;
  const authToken = props?.authToken;
  const userInfo = props?.userInfo;
  const ratings = [...RATINGS];

  const [errors, setErrors] = useState<string[]>([]);
  const [isDisable, setIsDisable] = useState<boolean>(false);
  const [ratingInfo, setRatingInfo] = useState<any>({
    rating: 0,
    comments: [],
    data: {},
  });

  const [troubles, setTroubles] = useState<string[]>([]);
  const formRef = useRef<any>(null);



  const onRatingClickHandler = (rating: number) => {
    setRatingInfo({ ...ratingInfo, rating });
  };

  const onTroubleOptionClickHandler = (trouble: string) => {
    let filteredTroubles = [];
    setErrors([]);
    if (troubles.includes(trouble)) {
      filteredTroubles = troubles.filter((trb) => trb! !== trouble);
    } else {
      filteredTroubles = [...troubles, trouble];
    }
    setTroubles(filteredTroubles);
    if (filteredTroubles.includes('Meeting didn’t happen')) {
      setRatingInfo((prev: any) => ({ ...prev, rating: 0 }));
      setIsDisable(true);
      return;
    }
    setIsDisable(false);
  };

  const onFormSubmit = async (e: any) => {
    e.preventDefault();
    if (!formRef.current) {
      return;
    }
    const formData = new FormData(formRef.current);
    const formattedData = transformObject(Object.fromEntries(formData));
    let response = FEEDBACK_RESPONSE_TYPES.positive.name;

    if (
      parseInt(formattedData.rating) > 0 ||
      formattedData.comments.includes('Noise or disturbance during the call') ||
      formattedData.comments.includes('Network issue')
    ) {
      response = FEEDBACK_RESPONSE_TYPES.positive.name;;
    } else {
      response = FEEDBACK_RESPONSE_TYPES.negative.name;;
    }

    if (formattedData?.comments?.length === 0 && formattedData.rating === '0') {
      setErrors((prev: any) => Array.from(new Set([...prev, 'Please provide comment(s) or select a rating'])));
      return;
    }

    if (!formattedData.isReasonGiven) {
      setErrors((prev: any) => Array.from(new Set([...prev, 'Please enter the reason(s)'])));
      return;
    } else if (formattedData.comments.includes('Got Rescheduled') && !formattedData?.data?.scheduledAt) {
      setErrors((prev: any) => Array.from(new Set([...prev, 'Please provide a date and time for the meeting rescheduled'])));
      return;
    }
    setErrors([]);
    document.dispatchEvent(new CustomEvent(EVENTS.TRIGGER_REGISTER_LOADER, { detail: true }));
    try {
      const filteredComments = formattedData?.comments?.filter((comment: string) => comment !== "Other")
      const result = await createFeedBack(userInfo.uid, currentFollowup.uid, authToken ?? '', {
        data: formattedData.data,
        type: `${currentFollowup?.type}_FEED_BACK`,
        rating: parseInt(formattedData.rating),
        comments: filteredComments,
        response,
      });
      document.dispatchEvent(new CustomEvent(EVENTS.TRIGGER_REGISTER_LOADER, { detail: false }));
      if (result?.error) {
        toast.error(TOAST_MESSAGES.SOMETHING_WENT_WRONG);
        onClose();
        return;
      }
      toast.success(TOAST_MESSAGES.FEEDBACK_THANK);
      onClose();
    } catch (error) {
      console.error(error);
      onClose();
      toast.error(TOAST_MESSAGES.SOMETHING_WENT_WRONG);
      document.dispatchEvent(new CustomEvent(EVENTS.TRIGGER_REGISTER_LOADER, { detail: false }));
    }
  };

  const transformObject = (object: any) => {
    let formData: any = {
      comments: [],
      rating: 0,
      data: {},
      isReasonGiven: true,
    };
    for (const key in object) {
      if (key === 'rating') {
        formData.rating = object[key];
      }

      if (key === 'scheduledAt') {
        if (object[key]) {
          formData.data.scheduledAt = `${object[key]} 00:00:00.000`;
        }
      }

      if (key === 'ratingComment' || key.startsWith('technicalIssue') || key.startsWith('didntHappenedReason') || key.startsWith('didntHappenedOption') || key.startsWith('technnicalIssueReason')) {
        if (object[key]) {
          formData.comments.push(object[key]);
        }
      }

      if(key.startsWith('didntHappenedReason') || key.startsWith('technnicalIssueReason')) {
        if(!object[key]) {
          formData.isReasonGiven = false;
        }
      }
    }
    return formData;
  };

  const reset = () => {
    setRatingInfo({
      rating: 0,
      comments: [],
      data: {},
    });
    setTroubles([]);
    setIsDisable(false);
    setErrors([]);
    if (formRef.current) {
      formRef.current.reset();
    }
  };

  useEffect(() => {
    reset();
  }, [currentFollowup]);

  return (
    <>
      <div className="hpndC">
        <form noValidate ref={formRef} onSubmit={onFormSubmit}>
          <div className="hdndC__formc">
            <div className="hpdnC__titleSec">
              <h2 className="hpdnC__titleSec__ttl">{`How was your recent meeting with ${currentFollowup?.interaction?.targetMember?.name}?`}</h2>
            </div>

            {errors.length > 0 && (
              <ul className="hpndC__trble__errors">
                {errors.map((error: string, index: number) => (
                  <li key={`error-${index}`}>{error}</li>
                ))}
              </ul>
            )}

            {/* Rating */}
            <div className="hdndC__ratingCndr">
              <div className="hdndC__ratingCndr__rts">
                {ratings?.map((rating: any, index: number) => (
                  <button
                    type="button"
                    onClick={() => onRatingClickHandler(index + 1)}
                    className={`hdndC__ratingCndr__rating ${ratingInfo?.rating === index + 1 ? 'selected' : ''} `}
                    style={{ backgroundColor: !isDisable ? rating.backgroundColor : rating.disableColor, pointerEvents: !isDisable ? 'auto' : 'none' }}
                    key={`${rating}+${index}`}
                  >
                    {rating.value}
                  </button>
                ))}
              </div>
              <div className="hdndC__ratingCndr__cmt">
                <span>Not Valueable</span>
                <span>Extremely Valueable</span>
              </div>
              <HiddenField value={ratingInfo?.rating.toString()} defaultValue={'0'} name={`rating`} />
            </div>

            {/* Comment */}
            {!isDisable && (
              <div className="hdndc__cmt">
                <div className="hdndc__cmt__ttl">Comment (Optional)</div>
                <div className="hdndc__cmt__cnt">
                  <TextArea maxLength={1000} placeholder="Enter comments if you have any" isMandatory={false} name={'ratingComment'} id={'ratingComment'} />
                </div>
              </div>
            )}

            {/* Trouble */}
            <div className="hpndC__trble">
              <TroubleSection currentFollowup={currentFollowup} setIsDisable={setIsDisable} setErrors={setErrors} troubles={troubles} onTroubleOptionClickHandler={onTroubleOptionClickHandler} />
            </div>
          </div>

          {/* Options */}

          <div className="hdndC__trble__optscon">
            <div className="hdndC__trble__optscon__optns">
              <button type="button" className="hdndc__trble__opts__cancel" onClick={onClose}>
                Cancel
              </button>

              <button className="hdndc__trble__opts__sbmt" type="submit">
                Submit
              </button>
            </div>
          </div>
        </form>
      </div>

      <style jsx>
        {`
          .hpndC {
            width: 85vw;
            overflow: auto;
            overflow: hidden;
          }
          .hdndC__formc {
            max-height: 75vh;
            min-height: 50vh;
            overflow: auto;
          }

          .hpdnC__titleSec__ttl {
            font-size: 16px;
            line-height: 20px;
            font-weight: 600;
            padding: 26px 42px 10px 24px;
          }

          .hdndC__ratingCndr {
            margin-top: 10px;
            display: flex;
            flex-direction: column;
            gap: 10px;
            padding: 0 24px 0 24px;
            padding-bottom: 8px;
          }

          .hdndC__ratingCndr__rts {
            display: flex;
            gap: 8px;
          }

          .hdndC__ratingCndr__rating {
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

          .selected {
            outline-style: solid;
            outline-width: 2px;
            outline-offset: 0;
            outline-color: #156ff7;
          }

          .hdndC__ratingCndr__cmt {
            display: flex;
            justify-content: space-between;
          }

          .hdndC__ratingCndr__cmt {
            color: #475569;
            font-size: 13px;
            font-weight: 500;
            line-height: 12px;
          }

          .hdndc__cmt {
            margin-top: 10px;
            display: flex;
            flex-direction: column;
            gap: 12px;
            padding: 0px 24px 0px 24px;
          }

          .hdndc__cmt__ttl {
            font-size: 14px;
            font-weight: 600;
            line-height: 20px;
          }

          .hdndc__cmt__cnt {
            textarea {
              height: 80px;
            }
          }

          .hpndC__trble {
            margin-top: 16px;
            margin-bottom: 0;
            padding: 0px 24px 0px 24px;
          }

          .hpndC__trble__errors {
            color: red;
            font-size: 12px;
            padding: 0px 40px 0px 40px;
          }

          .hdndC__trble__optscon {
            display: flex;
            justify-content: end;
            z-index: 2;
            width: 100%;
            background-color: white;
            padding: 24px;
          }

          .hdndC__trble__optscon__optns {
            display: flex;
            gap: 10px;
          }

          .hdndc__trble__opts__cancel {
            padding: 10px 24px;
            box-shadow: 0px 1px 1px 0px #0f172a14;
            border: 1px solid #cbd5e1;
            font-size: 14px;
            font-weight: 500;
            border-radius: 8px;
            line-height: 20px;
            background: white;
            display: flex;
            align-items: center;
          }

          .hdndc__trble__opts__sbmt {
            padding: 10px 24px;
            box-shadow: 0px 1px 1px 0px #0f172a14;
            border: 1px solid #cbd5e1;
            font-size: 14px;
            font-weight: 500;
            border-radius: 8px;
            line-height: 20px;
            background: #156ff7;
            color: #ffffff;
            display: flex;
            align-items: center;
          }

          @media (min-width: 1024px) {
            .hpndC {
              width: 650px;
            }

            .hpdnC__titleSec__ttl {
              font-size: 24px;
              font-weight: 700;
              line-height: 32px;
            }
          }
        `}
      </style>
    </>
  );
};

export default Happened;
