import { IAM_GOING_POPUP_MODES } from '@/utils/constants';
import { useState } from 'react';

interface IAttendeeOptions {
  onCloseClickHandler: () => void;
  mode: string;
}

const AttendeeOptions = (props: IAttendeeOptions) => {
  const onCloseClickHandler = props?.onCloseClickHandler;
  const [isCloseClicked, setIsCloseClicked] = useState(false);
  const mode = props?.mode;

  const onCloseClicked = () => {
    setIsCloseClicked(true);

    setTimeout(() => {
      setIsCloseClicked(false);
    }, 60000);
  }

  return (
    <>
      {isCloseClicked && <button className='atndform__optns__cls' onClick={onCloseClickHandler}>Confirm Close?</button>}
      {!isCloseClicked && (
        <button type="button" className="atndform__optns__cls" onClick={onCloseClicked}>
          Close
        </button>
      )}

      <button type="submit" className="atndform__optns__sbmt">
        {mode === IAM_GOING_POPUP_MODES.EDIT ? 'Save' : 'Submit'}
      </button>

      <style jsx>{`
        .atndform__optns__cls,
        .atndform__optns__sbmt {
          height: 40px;
          border-radius: 8px;
          padding: 10px 24px;
          font-size: 14px;
          line-height: 20px;
          font-weight: 500;
          border: 1px solid #cbd5e1;
          box-shadow: 0px 1px 1px 0px #0f172a14;
          background-color: inherit;
        }

        .atndform__optns__sbmt {
          background: #156ff7;
          color: white;
        }
      `}</style>
    </>
  );
};

export default AttendeeOptions;
