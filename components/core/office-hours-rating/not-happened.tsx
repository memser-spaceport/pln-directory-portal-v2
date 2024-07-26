import TextArea from '@/components/form/text-area';
import { useRef, useState } from 'react';
import { toast } from 'react-toastify';

const NotHappened = (props: any) => {
  const onClose = props?.onClose;
  const options = ['Broken Link', 'I plan to schedule soon', 'Preferred slot not available', 'Other'];

  const formRef = useRef<any>(null);
  const [selectedReasons, setSelectedReasons] = useState<string[]>([]);
  const [errors, setErrors] = useState<string[]>([]);

  const onReasonClickHandler = (reason: string, type: string) => {
    setErrors([]);
    if (type === 'Add') {
      setSelectedReasons((prev) => [...prev, reason]);
    } else {
      setSelectedReasons((prev) => {
        const filtered = [...prev].filter((prevReason) => prevReason !== reason);
        return filtered;
      });
    }
  };

  const onSubmitClickHandler = (e: any) => {
    e.preventDefault();
    if (!formRef.current) {
      return;
    }
    let reasons = [...selectedReasons].filter((reason) => reason !== 'Other');
    const formData: any = Object.fromEntries(new FormData(formRef.current));
    if (selectedReasons.includes('Other')) {
      if (!formData.reason) {
        setErrors((prev) => Array.from(new Set([...prev, 'Please fill the text area below.'])));
        return;
      }
      reasons.push(formData?.reason);
    }

    if (selectedReasons.length === 0) {
      setErrors((prev) => Array.from(new Set([...prev, 'Please select any reason below.'])));
      return;
    }
    toast.success('We will follow up for feedback soon.');
    onClose();
  };

  const onCancelClickHandler = () => {
    onClose();
  };

  return (
    <>
      <div className="notHappenedCtr">
        <div className="notHappenedCtr__titlectr">
          <h2 className="notHappenedCtr__titlectr__ttl">Let us know why you didn’t schedule?</h2>
        </div>

        {errors.length > 0 && (
          <ul className="notHappenedCtr__errors">
            {errors.map((error: string, index: number) => (
              <li key={`error-${index}`}>{error}</li>
            ))}
          </ul>
        )}

        <form ref={formRef} noValidate onSubmit={onSubmitClickHandler}>
          <div className="notHappenedCtr__bdy">
            {options?.map((option: any, index: number) => (
              <div key={`${index}+ ${index}`} className="notHappenedCtr__bdy__optnCtr">
                <div className="notHappenedCtr__bdy__optnCtr__optn">
                  {selectedReasons.includes(option) && (
                    <button className="notHappenedCtr__bdy__optnCtr__optn__sltd" onClick={() => onReasonClickHandler(option, 'Remove')}>
                      <img height={16} width={16} src="/icons/right-white.svg" />
                    </button>
                  )}
                  {!selectedReasons.includes(option) && <button className="notHappenedCtr__bdy__optnCtr__optn__ntsltd" onClick={() => onReasonClickHandler(option, 'Add')}></button>}
                  <div className="notHappenedCtr__bdy__optnCtr__optn__name">{option}</div>
                </div>
                {option === 'Other' && (
                  <div className="notHappenedCtr__bdy__optnCtr__othrc">
                    <div className="notHappenedCtr__bdy__optnCtr__othrc__ttl">Specify other reason(s)*</div>
                    <div className="notHappenedCtr__bdy__optnCtr__othrc__rson">
                      <TextArea isMandatory={selectedReasons.includes('Other')} maxLength={1000} name={'reason'} id={'reason'} />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="notHappenedCtr__ft">
            <button className="notHappenedCtr__ft__cancel" type="button" onClick={() => onCancelClickHandler()}>
              Cancel
            </button>
            <button type="submit" className="notHappenedCtr__ft__submit">
              Submit
            </button>
          </div>
        </form>
      </div>

      <style jsx>{`
        button {
          background: inherit;
        }
        .notHappenedCtr {
          padding: 24px;
          width: 80vw;
        }

        .notHappenedCtr__titlectr {
          padding-top: 10px;
          padding-bottom: 10px;
        }

        .notHappenedCtr__errors {
          color: red;
          font-size: 12px;
          padding: 0 16px 0px 16px;
        }

        .notHappenedCtr__bdy {
          margin-top: 18px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          padding: 12px 0px;
          border-radius: 4px;
          background: #f1f5f9;
        }

        .notHappenedCtr__ft {
          display: flex;
          justify-content: end;
          align-self: end;
          gap: 10px;
          margin-top: 16px;
        }

        .notHappenedCtr__ft__cancel {
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          padding: 10px 24px;
          font-size: 14px;
          line-height: 20px;
          font-weight: 500;
          box-shadow: 0px 1px 1px 0px #0f172a14;
        }

        .notHappenedCtr__ft__submit {
          background: #156ff7;
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          padding: 10px 24px;
          color: white;
          fon-size: 14px;
          font-weight: 500;
          line-height: 20px;
        }

        .notHappenedCtr__bdy__optnCtr {
          padding: 0px 12px;
        }

        .notHappenedCtr__bdy__optnCtr__optn {
          display: flex;
          gap: 6px;
          align-items: center;
        }

        .notHappenedCtr__bdy__optnCtr__optn__sltd {
          height: 20px;
          width: 20px;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #156ff7;
        }

        .notHappenedCtr__bdy__optnCtr__optn__ntsltd {
          height: 20px;
          width: 20px;
          border-radius: 4px;
          border: 1px solid #cbd5e1;
        }

        .notHappenedCtr__bdy__optnCtr__optn__name {
          font-size: 14px;
          line-height: 19px;
          font-weight: 400;
        }

        .notHappenedCtr__bdy__optnCtr__othrc {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-top: 6px;
        }

        .notHappenedCtr__bdy__optnCtr__othrc__ttl {
          font-size: 14px;
          line-height: 20px;
          font-weight: 600;
        }

        .notHappenedCtr__bdy__optnCtr__othrc__rson {
          textarea {
            height: 80px;
          }
        }

        @media (min-width: 1024px) {
          .notHappenedCtr {
            width: 650px;
          }

          .notHappenedCtr__titlectr__ttl {
            font-size: 24px;
            font-weight: 700;
            line-height: 32px;
          }
        }
      `}</style>
    </>
  );
};

export default NotHappened;
