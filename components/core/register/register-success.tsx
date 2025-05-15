import { SyntheticEvent } from 'react';

/**
 * Props for the RegisterSuccess component.
 * @interface RegisterSuccessProps
 * @property {() => void} onCloseForm - Callback to close the success form/modal.
 */
interface RegisterSuccessProps {
  onCloseForm: () => void;
}

/**
 * RegisterSuccess displays a success message after registration submission.
 *
 * @component
 * @param {RegisterSuccessProps} props - The props for the component.
 * @returns {JSX.Element} The rendered success message UI.
 */
function RegisterSuccess({ onCloseForm }: RegisterSuccessProps) {
  /**
   * Handles the close button click event.
   * Prevents event bubbling and calls the onCloseForm callback.
   * @param {SyntheticEvent} event - The click event.
   */
  const onCloseClicked = (event: SyntheticEvent) => {
    event.stopPropagation();
    event.preventDefault();
    if (onCloseForm) {
      onCloseForm();
    }
  };

  // Render the success message UI
  return (
    <>
      {/* Success message container */}
      <div className="success">
        <h2 className="success__title">Thank You for Submitting</h2>
        <p className="success__desc">Our team will review your request and get back to you shortly</p>
        {/* Close button triggers onCloseClicked */}
        <button onClick={onCloseClicked} type="button" className="success__btn">
          Close
        </button>
      </div>
      {/* Inline styles for the component */}
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
