import { useState } from 'react';
import HiddenField from './hidden-field';


interface ICustomCheckbox {
  isChecked: boolean;
  name: string;
  value: string;
  disabled: boolean;
}


const CustomCheckbox = (props: any) => {
  const [ischecked, setIsChecked] = useState(props?.isChecked);
  const name = props?.name;
  const value = props?.value;
  const disabled = props?.disabled ?? false;

  const onisCheckedClicked = () => {
    setIsChecked(!ischecked);
  };
  return (
    <>
      <button type="button" className={`chbox ${ischecked ? 'checked' : ''} ${disabled ? "disable" : ""}`} onClick={onisCheckedClicked}>
        {ischecked || disabled && <img src="/icons/right-white.svg" alt="checkbox" />}
        {ischecked  && <HiddenField name={name} value={value} defaultValue={value} />}
      </button>

      <style jsx>
        {`
          .chbox {
            height: 20px;
            width: 20px;
            min-width: 20px;
            min-height: 20px;
            display: flex;
            justify-content: center;
            align-items: center;
            border: 1px solid #cbd5e1;
            border-radius: 4px;
            background: inherit;
          }

          .checked {
            background-color: #156ff7;
          }

          .chbox__btn {
            height: 100%;
            width: 100%;
          }

          .disable {
          background-color: #64748B;
          pointer-events: none;
          }
        `}
      </style>
    </>
  );
};

export default CustomCheckbox;