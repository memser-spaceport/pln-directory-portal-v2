import { ChangeEvent, useEffect, useRef, useState } from 'react';

/**
 * Props for the TextFieldWithCopyIcon component.
 * @interface TextFieldProps
 * @extends React.InputHTMLAttributes<HTMLInputElement>
 * @property {function} [onChange] - Callback fired when the input value changes.
 * @property {function} [onClear] - Callback fired when the input is cleared (not currently used).
 * @property {string} [placeholder] - Placeholder text for the input.
 * @property {boolean} [isDelete] - Whether to show delete styling.
 * @property {boolean} [isMandatory] - Whether the field is required.
 * @property {string} [label] - Label for the input.
 * @property {string} type - Input type (required).
 * @property {string} name - Name attribute for the input (required).
 * @property {string} id - ID attribute for the input (required).
 * @property {string} [defaultValue] - Default value for the input.
 * @property {string} [value] - Controlled value for the input.
 * @property {boolean} [hide] - Whether to hide the input.
 * @property {number} [maxLength] - Maximum number of characters allowed.
 * @property {boolean} [isError] - Whether to show error styling.
 * @property {boolean} [readOnly] - Whether the input is read-only.
 */
interface TextFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  onChange?: (event: ChangeEvent<HTMLInputElement>) => void;
  onClear?: () => void;
  placeholder?: string;
  isDelete?: boolean;
  isMandatory?: boolean;
  label?: string;
  type: string;
  name: string;
  id: string;
  defaultValue?: string;
  value?: string;
  hide?: boolean;
  maxLength?: number;
  isError?: boolean;
  readOnly?: boolean;
}

/**
 * TextFieldWithCopyIcon is a text input component with a copy icon and optional validation/error states.
 *
 * @component
 * @param {TextFieldProps} props - The props for the component.
 * @returns {JSX.Element}
 */
const TextFieldWithCopyIcon: React.FC<TextFieldProps> = ({
  label,
  id,
  hide = false,
  name,
  value = '',
  defaultValue = '',
  onChange,
  isMandatory,
  placeholder,
  type,
  maxLength,
  isDelete,
  isError = false,
  readOnly = false,
  ...rest
}) => {
  // Ref for the input element
  const inputRef = useRef<HTMLInputElement | null>(null);
  // State for the entered value (for validation and error display)
  const [enteredValue, setEnteredValue] = useState(defaultValue);
  // Handler for input value change
  const onTextChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (onChange) {
      onChange(e);
      setEnteredValue(e.target.value);
    }
  };

  return (
    <>
      <div className={`tf ${hide ? 'hidden' : ''}`}>
        {label && (
          <label htmlFor={id} className={`tf__label ${hide ? 'hidden' : ''}`}>
            {label}
          </label>
        )}
        <div className="tf__inptcnt">
          <div className="tf__inptcnt__imgcnt">
            <img height={16} width={16} src="/icons/link-icon.svg" alt="copy-icon" className="tf__inptcnt__imgcnt__icon" />
          </div>
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
            readOnly={readOnly}
            {...rest}
          />
        </div>
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
            min-height: 40px;
            font-size: 14px;
            border: none;
            border-radius: 0px 8px 8px 0px;
            outline: none;
            padding-right: ${isDelete ? '35px' : ''};
            background-color: ${readOnly ? '#F1F5F9': ""};
            cursor: ${readOnly ? 'not-allowed': ""};
          }

          .tf__inptcnt {
            position: relative;
            display: flex;
            align-items: center;
            border: 1px solid red;
            border-radius: 8px;

            border: ${isError || (isMandatory && !enteredValue) ? '1px solid red' : '1px solid lightgrey' };
          }

          .tf__inptcnt__imgcnt {
            height: 40px;
            width: 40px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-right: 1px solid lightgray;
          }
          .tf__input:invalid {
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
            width: 0;
          }
        `}
      </style>
    </>
  );
};

export default TextFieldWithCopyIcon;
