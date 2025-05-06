import { BaseSyntheticEvent } from "react";

/**
 * Props for the Toggle component.
 * @interface IToggle
 * @property {string} height - The height of the toggle switch.
 * @property {string} width - The width of the toggle switch.
 * @property {boolean} isChecked - Whether the toggle is checked.
 * @property {(e: BaseSyntheticEvent) => void} callback - Callback when the toggle is changed.
 * @property {string} [id] - Optional id for the input.
 * @property {boolean} [disabled] - Whether the toggle is disabled.
 */
interface IToggle {
  height: string;
  width: string;
  isChecked: boolean;
  callback: (e:BaseSyntheticEvent) => void;
  id? :string
  disabled?: boolean; 
}

/**
 * Toggle is a custom switch component for boolean input, supporting disabled state and custom dimensions.
 *
 * @param {IToggle} props - The props for the Toggle component.
 * @returns {JSX.Element} The rendered toggle switch.
 */
const Toggle = (props:IToggle) => {
    // Destructure props for clarity
    const height = props?.height;
    const width = props?.width;
    const isChecked = props?.isChecked;
    const callback = props?.callback;
    const id = props?.id;
    const disabled = props?.disabled;
    return (
      <>
        {/* Main toggle label and input */}
        <label className='toogle' style={{ width: width, height: height }}>
          <input type='checkbox' checked={isChecked} onChange={(e) => callback(e)} id={`${id ? id : ''}`} disabled={disabled}/>
          <span className='toogle__slider toogle__round'></span>
        </label>
  
        {/* Inline styles for the toggle */}
        <style jsx>
          {`
            .toogle {
              position: relative;
              display: inline-block;
              border-radius: 25px;
              background: #cbd5e1;
            }
  
            .toogle input {
              opacity: 0;
              width: 0;
              height: 0;
            }
  
            .toogle__slider {
              position: absolute;
              cursor: ${disabled ? "default" : "pointer"};
              top: 0;
              left: 0;
              right: 0;
              bottom: 0;
              -webkit-transition: 0.2s;
              transition: 0.2s;
            }
  
            .toogle__slider:before {
              position: absolute;
              content: '';
              height: 12px;
              width: 12px;
              left: 3px;
              bottom: 2px;
              top: 2px;
              background-color: white;
              -webkit-transition: 0.2s;
              transition: 0.2s;
            }
  
            input:checked + .toogle__slider {
              background-color: ${disabled ? "#93C5FD" : "#156ff7"};
            }
            
            input:focus + .toogle__slider {
              box-shadow: 0 0 1px #2196f3;
            }
            
            input:checked + .toogle__slider:before {
              -webkit-transform: translateX(10px);
              -ms-transform: translateX(10px);
              transform: translateX(10px);
            }

            .toogle__slider.toogle__round {
              border-radius: 34px;
            }
  
            .toogle__slider.toogle__round:before {
              border-radius: 50%;
            }
          `}
        </style>
      </>
    );
  };
  
  export default Toggle;