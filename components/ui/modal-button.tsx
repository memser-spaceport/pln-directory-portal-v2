"use client";
import { SyntheticEvent } from "react";

/**
 * Props for the ModalButton component.
 * @interface IButton
 * @property {string} variant - The CSS class for button styling (e.g., 'primary', 'secondary').
 * @property {string} value - The button label text.
 * @property {'submit' | 'reset' | 'button' | undefined} type - The button type attribute.
 * @property {() => void} [callBack] - Optional click handler callback.
 * @property {boolean} [isDisabled] - Optional flag to disable the button.
 */
export interface IButton {
  variant: string;
  value: string;
  type: "submit" | "reset" | "button" | undefined;
  callBack?: () => void;
  isDisabled?: boolean;
}

/**
 * ModalButton renders a styled button for use in modals, supporting variants, disabled state, and click callbacks.
 *
 * @param {IButton} props - The props for the button.
 * @returns {JSX.Element} The rendered button element.
 */
const ModalButton = (props: IButton) => {
  // Extract props for clarity
  const value = props?.value;
  const className = props?.variant;
  const type = props?.type;
  const callBack = props?.callBack;
  const isDisabled = props?.isDisabled;

  return (
    <>
      {/* Button element with styling and event handling */}
      <button
        disabled={isDisabled}
        type={type}
        className={className}
        onClick={callBack}
      >
        {value}
      </button>
      {/* Inline styles for button variants and disabled state */}
      <style jsx>
        {`
          .primary {
            width: inherit;
            border-radius: 8px;
            border: 1px solid #cbd5e1;
            background: #156ff7;
            box-shadow: 0px 1px 1px 0px rgba(15, 23, 42, 0.08);
            color: #fff;
            font-size: 14px;
            padding: 10px 24px;
            font-weight: 500;
            line-height: 20px;
          }

          .secondary {
            width: inherit;
            border-radius: 8px;
            border: 1px solid #cbd5e1;
            background: #fff;
            box-shadow: 0px 1px 1px 0px rgba(15, 23, 42, 0.08);
            color: #0f172a;
            padding: 10px 24px;
            font-size: 14px;
            font-weight: 500;
            line-height: 20px;
          }

          button:disabled,
          button[disabled] {
            cursor: not-allowed;
            opacity: 0.6;
          }
        `}
      </style>
    </>
  );
};

export default ModalButton;
