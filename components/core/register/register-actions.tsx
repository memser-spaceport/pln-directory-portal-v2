'use client';

interface RegisterActionsProps {
  currentStep: string;
  onCloseForm: () => void;
  onBackClicked: () => void;
  onNextClicked: () => void;
}

function RegisterActions({ currentStep, onBackClicked, onCloseForm, onNextClicked }: RegisterActionsProps) {
  return (
    <>
      <div className="rfa rfa--desktop">
        {currentStep === 'basic' && (
          <button onClick={onCloseForm} className="rfa__cancel" type="button">
            Cancel
          </button>
        )}
        {currentStep !== 'basic' && (
          <button className="rfa__back" onClick={onBackClicked} type="button">
            Back
          </button>
        )}
        {currentStep !== 'social' && (
          <button className="rfa__next" onClick={onNextClicked} type="button">
            Next
          </button>
        )}
        {currentStep === 'social' && (
          <button className="rfa__submit" type="submit">
            Submit
          </button>
        )}
      </div>
      <div className="rfa rfa--mobile">
        <div className="rfa__cancelmobile">
          <button onClick={onCloseForm} className="rfa__cancel" type="button">
            Cancel
          </button>
        </div>
        <div className="rfa__group">
          {currentStep !== 'basic' && (
            <div className="rfa__back" onClick={onBackClicked}>
              Back
            </div>
          )}
          {currentStep !== 'social' && (
            <div className="rfa__next" onClick={onNextClicked}>
              Next
            </div>
          )}
          {currentStep === 'social' && (
            <button className="rfa__submit" type="submit">
              Submit
            </button>
          )}
        </div>
      </div>
      <style jsx>{`
        .rfa {
            position: sticky;
            bottom: 0;
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 16px 32px;
            border-top: 1px solid #e2e8f0;
            background: white;
            width: 100%;
          }

          .rfa--mobile {
            display: flex;
          }
          .rfa--desktop {
            display: none;
          }

          .rfa__group {
            display: flex;
            gap: 8px;
          }
          .rfa__cancelmobile {
            flex: 1;
          }

          .rfa__cancel,
          .rfa__back {
            padding: 10px 24px;
            border: 1px solid #cbd5e1;
            border-radius: 8px;
            background: white;
            cursor: pointer;
            font-size: 14px;
            font-weight: 500;
          }
          .rfa__next,
          .rfa__submit {
            padding: 10px 24px;
            border: 1px solid #cbd5e1;
            border-radius: 8px;
            background: #156ff7;
            cursor: pointer;
            color: white;
            font-size: 14px;
            font-weight: 500;
          }
          @media (min-width: 1024px) {
        
            .rfa {
              position: relative;
            }
        
            .rfa--mobile {
              display: none;
            }
            .rfa--desktop {
              display: flex;
            }
          }
      `}</style>
    </>
  );
}

export default RegisterActions;
