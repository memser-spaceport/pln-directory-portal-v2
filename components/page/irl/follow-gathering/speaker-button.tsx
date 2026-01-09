import { useIrlAnalytics } from '@/analytics/irl.analytics';
import { EVENTS } from '@/utils/constants';

interface SpeakerButtonProps {
  eventLocationSummary: any;
}

const SpeakerButton = ({ eventLocationSummary }: SpeakerButtonProps) => {
  const analytics = useIrlAnalytics();
  const handleClickSpeakerPopUp = () => {
    document.dispatchEvent(
      new CustomEvent(EVENTS.OPEN_SPEAKER_REQUEST_POPUP, {
        detail: { isOpen: true },
      }),
    );
    analytics.trackSpeakerRequestBtnClicked(eventLocationSummary);
  };

  return (
    <>
      <div className="speakerRoot">
        <button
          className="speakerRoot__followingBtn"
          onClick={handleClickSpeakerPopUp}
        >
          Be a Speaker
        </button>
      </div>
      <style jsx>
        {`
          .speakerRoot {
            width: 100%;
          }

          .speakerRoot__followBtn {
            padding: 9px 15px;
            // min-width: 103px;
            border: 1px solid #cbd5e1;
            background: #fff;
            border-radius: 8px;
            display: flex;
            gap: 8px;
            align-items: center;
            color: #0f172a;
            font-weight: 500;
            line-height: 20px;
            font-size: 14px;
            box-shadow: 0px 1px 1px 0px #0f172a14;
            width: 100%;
            justify-content: center;
          }

          .speakerRoot__followingBtn {
            padding: 9px 15px;
            border: 1px solid #cbd5e1;
            background: #ffffff;
            border-radius: 8px;
            display: flex;
            gap: 8px;
            align-items: center;
            font-weight: 500;
            line-height: 20px;
            font-size: 14px;
            border: 1px solid #cbd5e1;
            box-shadow: 0px 1px 1px 0px #0f172a14;
            width: 100%;
            justify-content: center;
          }


          @media (min-width: 1024px) {
            .speakerRoot {
              width: fit-content;
            }

            .speakerRoot__followBtn {
              max-width: 91px;
            }

            .speakerRoot__followingBtn {
              max-width: 110px;
            }
          }
        `}
      </style>
    </>
  );
};

export default SpeakerButton;
