'use client'
import React, { useEffect, useRef, useState } from 'react';

interface ToggleProps {
  id: string;
  label?: string;
  name: string;
  onChange?: (isChecked: boolean) => void
  checked?: boolean
  disabled?:boolean
  value?:boolean
  defaultValue?: boolean
}

const Toggle: React.FC<ToggleProps> = ({ id, label, defaultValue = false,  name, value = false, disabled=false, onChange, checked = false, ...props  }) => {
  const [isChecked, setIsChecked] = useState<boolean>(value || false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleToggle = () => {
    if(!disabled) {
      if(onChange) {
        onChange(!isChecked)
      }
      setIsChecked(!isChecked);
    }
  };

  useEffect(() => {
     if(inputRef.current) {
      inputRef.current.checked = value;
      setIsChecked(value)
     }
  }, [value])

  return (
    <>
      <div className="toggle-container">
        {label && <label htmlFor={id}>{label}</label>}
        <div className={`toggle-switch ${isChecked ? 'checked' : ''} ${disabled ? 'toggle-switch--disabled': ''}`} onClick={handleToggle}>
          <div className="toggle-knob" />
        </div>
        <input ref={inputRef} type="checkbox" name={name} disabled={disabled} id={id} {...props} onChange={handleToggle} style={{ width: '0px', height: '0px' }} />
      </div>
      <style jsx>
        {`
          .toggle-container {
            display: flex;
            align-items: center;
          }
          .toggle-switch {
            width: 28px;
            height: 16px;
            background-color: #ccc;
            border-radius: 16px;
            position: relative;
            cursor: pointer;
            transition: background-color 0.3s;
          }
            .toggle-switch--disabled {
             cursor: not-allowed;
            }
          .toggle-switch.checked {
            background-color: #156ff7;
          }
          .toggle-knob {
            width: 14px;
            height: 14px;
            background-color: #fff;
            border-radius: 50%;
            position: absolute;
            top: 1px;
            left: 1px;
            transition: left 0.3s;
          }
          .toggle-switch.checked .toggle-knob {
            left: 13px;
          }
        `}
      </style>
    </>
  );
};

export default Toggle;
