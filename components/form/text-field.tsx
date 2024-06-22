import { ChangeEvent, useRef, useState } from 'react';

interface TextFieldProps {
  onChange?: (event: ChangeEvent<HTMLInputElement>) => void;
  onClear?: () => void;
  placeholder?: string;
  isMandatory?: boolean;
  label?: string;
  type: string;
  name: string;
  id: string;
  defaultValue?: string;
  maxLength?:number;
}

const TextField: React.FC<TextFieldProps> = ({ label, id, name, defaultValue = '', onChange, isMandatory, placeholder, type, maxLength }) => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [inputValue, setInputValue] = useState<string>(defaultValue);
  const onTextChange = (e: ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    if(onChange) {
        onChange(e)
    }
  }
  return (
    <>
      <div className="tf">
        {label && <label htmlFor={id} className="tf__label">{label}</label>}
        <input
          ref={inputRef}
          name={name}
          id={id}
          placeholder={placeholder}
          onChange={onTextChange}
          className={`tf__input`}
          type={type}
          defaultValue={defaultValue}
          required={isMandatory}
          maxLength={maxLength}
        />
      </div>
      <style jsx>
        {`
          .tf {
            display: flex;
            flex-direction: column;
            width: 100%;
          }
          .tf__label {
            font-weight: 600;
            font-size: 14px;
            margin-bottom: 12px;
          }
          .tf__input {
            width: 100%;
            padding: 8px 12px;
            border: 1px solid lightgrey;
            border-radius: 8px;
            min-height:40px;
          }

          .tf__input:invalid {
            border: 1px solid red;
          }

          .tf__input:focus-visible,
          .tf__input:focus {
            outline: none;
          }
        `}
      </style>
    </>
  );
};

export default TextField;
