"use client";
import { SyntheticEvent } from "react";

export interface IButton {
  variant: string;
  value: string;
  type: "submit" | "reset" | "button" | undefined;
  callBack?: () => void;
  isDisabled?: boolean;
}

const ModalButton = (props: IButton) => {
  const value = props?.value;
  const className = props?.variant;
  const type = props?.type;
  const callBack = props?.callBack;
  const isDisabled = props?.isDisabled;

  return (
    <>
      <button
        disabled={isDisabled}
        type={type}
        className={className}
        onClick={callBack}
      >
        {value}
      </button>
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
