import { BaseSyntheticEvent } from "react";

interface IToggle {
  height: string;
  width: string;
  isChecked: boolean;
  callback: (e:BaseSyntheticEvent) => void;
  id? :string
}

const Toggle = (props:IToggle) => {
    const height = props?.height;
    const width = props?.width;
    const isChecked = props?.isChecked;
    const callback = props?.callback;
    const id = props?.id;
    return (
      <>
        <label className='toogle' style={{ width: width, height: height }}>
          <input type='checkbox' checked={isChecked} onChange={(e) => callback(e)} id={`${id ? id : ''}`} />
          <span className='toogle__slider toogle__round'></span>
        </label>
  
        <style jsx>
          {`
            .toogle {
              position: relative;
              display: inline-block;
              border-radius: 25px;
              border: 0.4px solid rgba(203, 213, 225, 0.4);
              background: var(--elements-background-mild, #f1f5f9);
            }
  
            .toogle input {
              opacity: 0;
              width: 0;
              height: 0;
            }
  
            .toogle__slider {
              position: absolute;
              cursor: pointer;
              top: 0;
              left: 0;
              right: 0;
              bottom: 0;
              -webkit-transition: 0.4s;
              box-shadow: 0px 0px 2px rgba(15, 23, 42, 0.16);
              transition: 0.4s;
            }
  
            .toogle__slider:before {
              position: absolute;
              content: '';
              height: 14px;
              width: 14px;
              left: 3px;
              bottom: 2px;
              top: 2px;
              background-color: white;
              -webkit-transition: 0.4s;
              transition: 0.4s;
            }
  
            input:checked + .toogle__slider {
              background-color: #2196f3;
            }
  
            input:focus + .toogle__slider {
              box-shadow: 0 0 1px #2196f3;
            }
  
            input:checked + .toogle__slider:before {
              -webkit-transform: translateX(15px);
              -ms-transform: translateX(15px);
              transform: translateX(15px);
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