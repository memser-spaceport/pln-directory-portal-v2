'use client';
import React, { FC, ChangeEvent, useRef, useEffect } from 'react';

// This component renders a custom toggle switch (checkbox) with optional props for checked state, disabled state, and event handling.

interface CustomToggleProps {
  id: string;
  name: string;
  defaultChecked?: boolean;
  disabled?: boolean;
  checked?: boolean;
  onChange?: (event: any) => void;
}

const CustomToggle: FC<CustomToggleProps> = ({ id, name, checked, disabled = false, defaultChecked = false, onChange = () => {} }) => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  
  useEffect(() => {
    // Update the input's checked state when the checked prop changes
    if((checked === true || checked === false) && inputRef.current ) {
      inputRef.current.checked = checked;
    }
  }, [checked])

  return (
    <>
      <label className="custom-toggle" style={{'pointerEvents': `${disabled ? 'none': 'auto'}`}} htmlFor={id}>
        <input 
          ref={inputRef} 
          type="checkbox" 
          id={id} 
          name={name} 
          data-testid={`${name}-toggle`}
          style={{'pointerEvents': `${disabled ? 'none': 'auto'}`}} 
          {...((defaultChecked === true || defaultChecked === false)) && {defaultChecked: defaultChecked}} 
          onClick={onChange} 
        />
        <span className="slider" />
      </label>
      <style jsx>
        {`
          // Styles for the custom toggle switch
          .custom-toggle {
            position: relative;
            display: inline-block;
            width: 28px;
            height: 16px;
          }

          .custom-toggle input {
            opacity: 0;
            width: 0;
            height: 0;
          }

          .slider {
            position: absolute;
            cursor: pointer;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-color: #ccc;
            transition: 0.4s;
            border-radius: 16px;
          }

          .slider:before {
            position: absolute;
            content: '';
            height: 12px;
            width: 12px;
            left: 2px;
            bottom: 2px;
            background-color: white;
            transition: 0.4s;
            border-radius: 50%;
          }

          input:checked + .slider {
            background-color: #156ff7;
          }

          input:checked + .slider:before {
            transform: translateX(12px);
          }

          .custom-toggle.disabled {
            cursor: not-allowed;
          }

          .custom-toggle input:disabled + .slider {
            background-color: #e0e0e0;
          }

          .custom-toggle input:disabled:checked + .slider {
            background-color: #156ff7;
          }

          .custom-toggle input:disabled + .slider:before {
            background-color: #bdbdbd;
          }

          .custom-toggle input:disabled:checked + .slider:before {
            background-color: white;
          }
        `}
      </style>
    </>
  );
};

// Exporting the CustomToggle component for use in other parts of the application
export default CustomToggle;
