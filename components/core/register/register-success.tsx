import { SyntheticEvent } from 'react';

interface RegisterSuccessProps {
  onCloseForm: () => void;
}

function RegisterSuccess({ onCloseForm }: RegisterSuccessProps) {
  const onCloseClicked = (event: SyntheticEvent) => {
    event.stopPropagation();
    event.preventDefault();
    if (onCloseForm) {
      onCloseForm();
    }
  };
  return (
    <>
      <div className="success">
        <h2 className="success__title">Thank You for Submitting</h2>
        <p className="success__desc">Our team will review your request and get back to you shortly</p>
        <button onClick={onCloseClicked} type="button" className="success__btn">
          Close
        </button>
      </div>
      <style jsx>
        {`
          .success {
            width: 100%;
            position: relative;
            height: 100%;
            background: white;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-direction: column;
            gap: 16px;
            padding: 16px;
          }
          .success__title {
            font-size: 24px;
            font-weight: 700;
          }
          .success__desc {
            font-size: 18px;
            font-weight: 400;
            text-align: center;
          }
          .success__btn {
            padding: 10px 24px;
            border-radius: 8px;
            background: #156ff7;
            outline: none;
            border: none;
            color: white;
          }

          @media (min-width: 1024px) {
            .success {
              height: 100%;
            }
            .success__desc {
              font-size: 16px;
            }
          }
        `}
      </style>
    </>
  );
}

export default RegisterSuccess;
