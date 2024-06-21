import React, { useState } from 'react';

interface ToggleProps extends React.InputHTMLAttributes<HTMLInputElement> {
  id: string;
  label?: string;
  name: string;
}

const Toggle: React.FC<ToggleProps> = ({ id, label, name, ...props }) => {
  const [isChecked, setIsChecked] = useState<boolean>(props.checked || false);

  const handleToggle = () => {
    setIsChecked(!isChecked);
  };

  return (
    <>
      <div className="toggle-container">
        {label && <label htmlFor={id}>{label}</label>}
        <div className={`toggle-switch ${isChecked ? 'checked' : ''}`} onClick={handleToggle}>
          <div className="toggle-knob" />
        </div>
        <input type="checkbox" name={name} id={id} {...props} checked={isChecked} onChange={handleToggle} style={{ display: 'none' }} />
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
