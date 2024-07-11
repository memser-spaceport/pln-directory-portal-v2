import { ChangeEvent, useEffect, useRef, useState } from 'react';

interface TextFieldProps extends React.InputHTMLAttributes<HTMLInputElement>  {
  onChange?: (event: ChangeEvent<HTMLInputElement>) => void;
  onClear?: () => void;
  placeholder?: string;
  isMandatory?: boolean;
  label?: string;
  type: string;
  name: string;
  id: string;
  defaultValue?: string;
  value?: string;
  hide?:boolean;
  maxLength?:number;
}

const TextField: React.FC<TextFieldProps> = ({ label, id, hide = false, name, value = '', defaultValue = '', onChange, isMandatory, placeholder, type, maxLength, ...rest }) => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const onTextChange = (e: ChangeEvent<HTMLInputElement>) => {
    if(onChange) {
        onChange(e)
    }
  }

  return (
    <>
      <div className={`tf ${hide ? 'hidden': ''}`}>
        {label && <label htmlFor={id} className={`tf__label ${hide ? 'hidden': ''}`}>{label}</label>}
        <input
          ref={inputRef}
          name={name}
          id={id}
          placeholder={placeholder}
          onChange={onTextChange}
          className="tf__input"
          type={type}
          required={isMandatory}
          defaultValue={defaultValue}
          maxLength={maxLength}
          autoComplete="off"
          {...rest}
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
            font-size: 14px;
          }
          .tf__input:invalid {
            border: 1px solid red;
          }

          .tf__input:focus-visible,
          .tf__input:focus {
            outline: none;
          }
            ::placeholder {
              color: #aab0b8;
            }
               .hidden {
            visibility: hidden;
            height: 0;
            width:0;
           }
        `}
      </style>
    </>
  );
};

export default TextField;
