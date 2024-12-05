import { useEffect, useState } from 'react';
import HiddenField from './hidden-field';

interface ICustomCheckbox {
  name: string;
  value: string;
  disabled?: boolean;
  onSelect: any;
  initialValue: any
}

const CustomCheckbox = (props: ICustomCheckbox) => {
  const [ischecked, setIsChecked] = useState(false);
  const name = props?.name;
  const value = props?.value;
  const disabled = props?.disabled ?? false;
  const onSelect = props?.onSelect;

  const onisCheckedClicked = () => {
      onSelect();
    setIsChecked(!ischecked);
  };

  useEffect(() => {
    setIsChecked(props?.initialValue ?? false);
  }, [props?.initialValue]);

  return (
    <>
      <button type="button" disabled={disabled} className={`chbox ${ischecked ? (disabled ? 'checked--disable' : 'checked') : (disabled ? 'unchecked--disable' : 'unchecked')}`}  onClick={onisCheckedClicked}>
        {ischecked && <img src="/icons/right-white.svg" alt="checkbox" />}
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

          .chbox__btn {
            height: 100%;
            width: 100%;
          }

          .checked--disable {
            background-color: #64748b !important;
            pointer-events: none;
          }

          .unchecked--disable {
            background-color: #cbd5e1 !important;
            cursor: not-allowed;
          }

          .unchecked {
            background-color: transparent;
          }

          .checked {
            background-color: #156ff7;
          }


        `}
      </style>
    </>
  );
};

export default CustomCheckbox;
