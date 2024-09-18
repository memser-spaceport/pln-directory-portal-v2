import TextArea from '@/components/form/text-area';
import { useState } from 'react';

const TopicsDescription = () => {
  const [reason, setReason] = useState('');

  const onReasonChange = (e: any) => {
    setReason(e.target.value);
  };

  return (
    <>
      <div className="desccnt">
        <div className="desccnt__ttlcnt">
          <p>Briefly describe about the topics you are interested in</p>
        </div>

        <div className="desccnt__reasoncnt">
          <TextArea onChange={onReasonChange} name={'reason'} id={''} placeholder="Enter details here" maxLength={250} />
        </div>

        <div className="desccnt__desccnt">
          <p>{250 - reason.length} characters remaining</p>
        </div>
      </div>

      <style jsx>
        {`
          .desccnt {
            display: flex;
            flex-direction: column;
            gap: 12px;
          }

          .desccnt__reasoncnt {
            textarea:focus {
              outline: 1px solid #156ff7;
            }
          }

          .desccnt__ttlcnt {
            font-size: 14px;
            font-weight: 600;
            line-height: 20px;
          }

          .desccnt__desccnt {
            font-size: 13px;
            font-weight: 400;
            line-height: 18px;
          }
        `}
      </style>
    </>
  );
};

export default TopicsDescription;
