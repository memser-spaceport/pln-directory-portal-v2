'use client';
import React, { FC, ChangeEvent, useRef, useEffect } from 'react';

interface ToggleReadonlyProps {
  checked?: boolean;
}

const ToggleReadonly: FC<ToggleReadonlyProps> = ({ checked = false}) => {

  return (
    <>
      <label className="custom-toggle" style={{pointerEvents: 'none'}}>
        <input readOnly type="checkbox" style={{pointerEvents: 'none'}} checked={checked} />
        <span className="slider" />
      </label>
      <style jsx>
        {` 
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

export default ToggleReadonly;
