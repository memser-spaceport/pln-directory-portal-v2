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
}

const TextArea: React.FC<TextAreaProps> = ({ label, id, name, defaultValue = '', onChange, isMandatory, placeholder, type }) => {
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const [inputValue, setInputValue] = useState<string>('');
  const onTextChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
    if(onChange) {
        onChange(e)
    }
  }
  return (
    <>
      <div className="tf">
        {label && <label htmlFor={id} className="tf__label">{label}</label>}
        <textarea
          ref={inputRef}
          name={name}
          id={id}
          placeholder={placeholder}
          onChange={onTextChange}
          className={`tf__input ${(inputValue === '' && isMandatory) ? 'tf__input--error': ''}`}
          defaultValue={defaultValue}
          required={isMandatory}
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
          }
          .tf__input--error {
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

export default TextArea;
