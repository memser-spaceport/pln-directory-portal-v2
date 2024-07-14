import { ChangeEvent, useRef, useState } from 'react';

interface TextAreaProps {
  onChange?: (event: ChangeEvent<HTMLTextAreaElement>) => void;
  onClear?: () => void;
  placeholder?: string;
  isMandatory?: boolean;
  label?: string;
  name: string;
  id: string;
  defaultValue?: string;
  maxLength?: number;
}

const TextArea: React.FC<TextAreaProps> = ({ label, id, name, defaultValue = '', onChange, isMandatory, placeholder, maxLength }) => {
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const onTextChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    if (onChange) {
      onChange(e);
    }
  };
  return (
    <>
      <div className="tf">
        {label && (
          <label htmlFor={id} className="tf__label">
            {label}
          </label>
        )}
        <textarea
          ref={inputRef}
          name={name}
          id={id}
          placeholder={placeholder}
          onChange={onTextChange}
          className="tf__input"
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
            font-family: 'Inter', sans-serif;
            font-size: 14px;
            line-height: 24px;
            resize: vertical;
            height: 60px;
            min-height: 60px;
          }
          .tf__input:invalid {
            border: 1px solid red;
          }

          .tf__input:focus-visible,
          .tf__input:focus {
            outline: none;
          }

          .tf__input::placeholder {
            color: #0f172a;
            opacity: 40%;
            font-size: 14px;
            font-weight: 500;
            line-height: 24px;
          }
        `}
      </style>
    </>
  );
};

export default TextArea;
