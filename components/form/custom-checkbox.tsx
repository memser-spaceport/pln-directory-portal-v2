import { useState } from 'react';
import HiddenField from './hidden-field';

interface ICustomCheckbox {
  name: string;
  value: string;
  disabled: boolean;
  onSelect: any;
  initialValue: any
}

const CustomCheckbox = (props: ICustomCheckbox) => {
  const [ischecked, setIsChecked] = useState(props?.initialValue ?? false);
  const name = props?.name;
  const value = props?.value;
  const disabled = props?.disabled ?? false;
  const onSelect = props?.onSelect;

  const onisCheckedClicked = () => {
      onSelect();
    setIsChecked(!ischecked);
  };
  return (
    <>
      <button type="button" className={`chbox ${ischecked ? 'checked' : ''} ${disabled ? 'disable' : ''}`} onClick={onisCheckedClicked}>
        {(ischecked || disabled) && <img src="/icons/right-white.svg" alt="checkbox" />}
        {(ischecked || disabled) && <HiddenField name={name} value={value} defaultValue={value} />}
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
            background-color: #64748b;
            pointer-events: none;
          }
        `}
      </style>
    </>
  );
};

export default CustomCheckbox;
