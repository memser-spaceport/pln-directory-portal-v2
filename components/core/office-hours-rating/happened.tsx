import TextArea from '@/components/form/text-area';
import { useRef, useState } from 'react';
import TroubleSection from './trouble-section';
import HiddenField from '@/components/form/hidden-field';

const Happened = (props: any) => {
  const onClose = props?.onClose;
  const recentlyBooked = props?.recentlyBooked;
  const userName = recentlyBooked?.name || '';

  const [errors, setErrors] = useState([]);

  const [ratingInfo, setRatingInfo] = useState({
    rating: 0,
    comments: [],
  });

  const [troubles, setTroubles] = useState<string[]>([]);
  const formRef = useRef(null);

  const ratings = [
    {
      value: 1,
      backgroundColor: '#FFD9C9',
    },

    {
      value: 2,
      backgroundColor: '#FFF2C9',
    },

    {
      value: 3,
      backgroundColor: '#FFF2C9',
    },

    {
      value: 4,
      backgroundColor: '#C5F9D0',
    },

    {
      value: 5,
      backgroundColor: '#C5F9D0',
    },
  ];

  const onRatingClickHandler = (rating: number) => {
    setRatingInfo({ ...ratingInfo, rating });
  };

  const onTroubleOptionClickHandler = (trouble: string) => {
    if (troubles.includes(trouble)) {
      const filteredTroubles = troubles.filter((trb) => trb! !== trouble);
      setTroubles([...filteredTroubles]);
    } else {
      setTroubles((prev) => [...prev, trouble]);
    }
  };

  const onFormSubmit = (e: any) => {
    e.preventDefault();
    if (!formRef.current) {
      return;
    }
    const formData = new FormData(formRef.current);
    const formattedData = transformObject(Object.fromEntries(formData));
  };

  const transformObject = (object: any) => {
    let issues = [];
    let rating = 0;
    for (const key in object) {
      console.log('key is', key);
      if (key === 'ratingComment') {
        if (object[key]) {
          issues.push(object[key]);
        }
      }

      if (key === 'rating') {
        rating = object[key];
      }

      if (key.startsWith('technicalIssue')) {
        if (object[key]) {
          issues.push(object[key]);
        }
      }

      if(key.startsWith('didntHappenedReason')) {
        if(object[key]) {
          issues.push(object[key]);
        }
      }

      if(key.startsWith('didntHappenedOption')) {
        if(object[key]) {
          issues.push(object[key]);
        }
      }

      if(key.startsWith('technnicalIssueReason')) {
        if(object[key]) {
          issues.push(object[key]);
        }
      }
    }

  };

  return (
    <>
      <div className="hpndC">
        <form noValidate ref={formRef} onSubmit={onFormSubmit}>
          <div className="hpdnC__titleSec">
            <h2 className="hpdnC__titleSec__ttl">How was your recent meeting with {userName}?</h2>
          </div>

          {/* Rating */}
          <div className="hdndC__ratingCndr">
            <div className="hdndC__ratingCndr__rts">
              {ratings?.map((rating: any, index: number) => (
                <button
                  onClick={() => onRatingClickHandler(index + 1)}
                  className={`hdndC__ratingCndr__rating ${ratingInfo?.rating === index + 1 ? 'selected' : ''}`}
                  style={{ backgroundColor: rating.backgroundColor }}
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
            <HiddenField value={ratingInfo?.rating.toString()} defaultValue={''} name={`rating`} />
          </div>

          {/* Comment */}
          <div className="hdndc__cmt">
            <div className="hdndc__cmt__ttl">Comment (Optional)</div>
            <div className="hdndc__cmt__cnt">
              <TextArea maxLength={1000} placeholder="Enter comments if you have any" isMandatory={false} name={'ratingComment'} id={'ratingComment'} />
            </div>
          </div>

          {/* Trouble */}
          <div className="hpndC__trble">
            <TroubleSection troubles={troubles} onTroubleOptionClickHandler={onTroubleOptionClickHandler} />
          </div>

          {/* Options */}

          <div className="hdndC__trble__opts">
            <button type="button" className="hdndc__trble__opts__cancel">
              Cancel
            </button>

            <button className="hdndc__trble__opts__sbmt" type="submit">
              Submit
            </button>
          </div>
        </form>
      </div>

      <style jsx>
        {`
          .hpndC {
            padding: 24px;
            width: 80vw;
            max-height: 80vh;
            overflow: auto;
            min-height: 65vh;
          }

          .hpdnC__titleSec__ttl {
            font-size: 24px;
            font-weight: 700;
            line-height: 32px;
            padding: 10px 0px;
          }

          .hdndC__ratingCndr {
            margin-top: 10px;
            display: flex;
            flex-direction: column;
            gap: 10px;
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
            clorl: #475569;
            font-size: 13px;
            font-weight: 500;
            line-height: 12px;
          }

          .hdndc__cmt {
            margin-top: 10px;
            display: flex;
            flex-direction: column;
            gap: 12px;
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
          }

          @media (min-width: 1024px) {
            .hpndC {
              width: 650px;
            }
          }
        `}
      </style>
    </>
  );
};

export default Happened;
