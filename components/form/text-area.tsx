import { ChangeEvent, useRef, useState } from 'react';

/**
 * Props for the TextArea component.
 * @interface TextAreaProps
 * @property {function} [onChange] - Callback fired when the text area value changes.
 * @property {function} [onClear] - Callback fired when the text area is cleared (not currently used).
 * @property {string} [placeholder] - Placeholder text for the text area.
 * @property {boolean} [isMandatory] - Whether the field is required.
 * @property {string} [label] - Label for the text area.
 * @property {string} name - Name attribute for the text area (required).
 * @property {string} id - ID attribute for the text area (required).
 * @property {string} [defaultValue] - Default value for the text area.
 * @property {number} [maxLength] - Maximum number of characters allowed.
 */
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
  disabled?: boolean;
}

/**
 * TextArea is a reusable controlled textarea component with label and validation support.
 *
 * @component
 * @param {TextAreaProps} props - The props for the component.
 * @returns {JSX.Element}
 */
const TextArea: React.FC<TextAreaProps> = ({ label, id, name, defaultValue = '', onChange, isMandatory, placeholder, maxLength, disabled }) => {
  // Ref for the textarea element (not currently used for focus or value access)
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  // Handler for textarea value change
  const onTextChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    if (onChange) {
      onChange(e);
    }
  };

  // Render the textarea with label and styles
  return (
    <>
      <div className="tf">
        {/* Render label if provided */}
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
          disabled={disabled}
        />
      </div>
      {/* Inline styles for the component */}
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
