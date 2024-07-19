import React from 'react';

interface RadioButtonProps {
  name: string;
  options: { label: string; value: string }[];
  selectedValue: string;
  onChange: (value: string) => void;
}

const RadioButton: React.FC<RadioButtonProps> = ({ name, options, selectedValue, onChange }) => {
  return (
    <>
      <div className="custom-radio-group">
        {options.map((option) => (
          <label key={option.value} className="custom-radio-button">
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={selectedValue === option.value}
              onChange={() => onChange(option.value)}
            />
            <span className="custom-radio-inner"></span>
            {option.label}
          </label>
        ))}
      </div>
      <style jsx>
        {`
          .custom-radio-group {
            display: flex;
            flex-direction: column;
          }

          .custom-radio-button {
            display: flex;
            align-items: center;
            cursor: pointer;
            margin: 5px 0;
            position: relative;
          }

          .custom-radio-button input[type='radio'] {
            opacity: 0;
            position: absolute;
            width: 0;
            height: 0;
          }

          .custom-radio-button .custom-radio-inner {
            width: 20px;
            height: 20px;
            border-radius: 50%;
            border: 2px solid #ccc;
            margin-right: 10px;
            position: relative;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .custom-radio-button input[type='radio']:checked + .custom-radio-inner {
            border-color: #007bff;
          }

          .custom-radio-button input[type='radio']:checked + .custom-radio-inner::after {
            content: '';
            width: 12px;
            height: 12px;
            border-radius: 50%;
            background: #007bff;
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
          }
        `}
      </style>
    </>
  );
};

export default RadioButton;
