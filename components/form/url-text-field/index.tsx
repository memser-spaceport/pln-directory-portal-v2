import React, { useState } from 'react';
import TextField from '../text-field';
import URLFieldError from '../url-field-error';
import { isValidURL, getURLErrorMessage, URLType } from '../../../utils/url-validation';

interface URLTextFieldProps {
  id: string;
  name: string;
  label?: string;
  placeholder?: string;
  defaultValue?: string;
  maxLength?: number;
  type?: string;
  isMandatory?: boolean;
  urlType: URLType;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const URLTextField = ({
  id,
  name,
  label,
  placeholder,
  defaultValue = '',
  maxLength,
  type = 'text',
  isMandatory = false,
  urlType,
  onChange,
}: URLTextFieldProps) => {
  const [value, setValue] = useState(defaultValue);
  const [touched, setTouched] = useState(false);
  const isInvalid = touched && value !== '' && !isValidURL(value, urlType);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value);
    if (onChange) {
      onChange(e);
    }
  };

  return (
    <div className="url-field-container">
      <TextField
        id={id}
        name={name}
        label={label}
        placeholder={placeholder}
        defaultValue={defaultValue}
        maxLength={maxLength}
        type={type}
        isMandatory={isMandatory}
        onChange={handleChange}
        onBlur={() => setTouched(true)}
      />
      <URLFieldError 
        message={getURLErrorMessage(urlType)} 
        show={isInvalid} 
      />
      
      <style jsx>{`
        .url-field-container {
          position: relative;
          width: 100%;
          margin-bottom: 8px;
        }
      `}</style>
    </div>
  );
};

export default URLTextField;