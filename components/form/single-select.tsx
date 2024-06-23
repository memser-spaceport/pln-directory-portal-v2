
import React, { Fragment, useEffect, useState } from 'react';


export interface SingleSelectProps {
  buttonContent?: React.ReactNode;
  initialOption?: ISingleSelectOption;
  onChange?: (value: ISingleSelectOption, name?: string) => void;
  placeholder?: string;
  options: ISingleSelectOption[];
  value?: ISingleSelectOption;
  name?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  validateBeforeChange?: boolean;
  validationFn?: (selected: ISingleSelectOption) => boolean;
  confirmationMessage?: string;
}

export interface ISingleSelectOption {
  icon?: React.ComponentType<React.SVGProps<SVGSVGElement>> | string;
  label: string;
  value?: string;
}

export function SingleSelect({
  options = [],
  onChange,
  initialOption = options?.[0],
  buttonContent,
  name,
  value,
  required = false,
  disabled = false,
  placeholder = 'Select a value',
  className = '',
}: SingleSelectProps): JSX.Element {
  const [selectedOption, setSelectedOption] = useState(initialOption);
  const requiredIndicator =
    required && !selectedOption?.value ? 'border custom-red' : '';

  function onChangeHandler(value: string) {
    const selectedDropdownOption = options.find(
      (option) => option.value === value
    );

    if (selectedDropdownOption) {
      changeOption(selectedDropdownOption, name);
    }
  }

  const changeOption = (selectedDropdownOption : ISingleSelectOption, name : string | undefined)=> {
    setSelectedOption(selectedDropdownOption);
    onChange && onChange(selectedDropdownOption, name);
  }

  useEffect(() => {
    if (value !== undefined) setSelectedOption(value);
  }, [setSelectedOption, value]);


  return (
    <>
      <Listbox
        as="div"
        name={name}
        value={selectedOption?.value}
        onChange={onChangeHandler}
        placeholder="Enter value"
        className="w-full text-sm"
        disabled={disabled}
      >

        {({ open }) => (
          <div className="relative">
            <Listbox.Button
              className={`on-focus flex h-10 w-full items-center rounded-lg border border-[#CBD5E1] bg-white px-3 transition duration-150 ease-in-out active:border-blue-600 active:ring-2 active:ring-blue-300 disabled:bg-slate-100 ${open ? 'border-blue-600 ring-2 ring-blue-300' : ''
                } ${className} ${requiredIndicator}`}
              data-testid="dropdown__button"
            >
              {buttonContent ? (
                buttonContent
              ) : selectedOption?.label ? (
                <div className="text-left leading-6 flex">
                    <span className='relative'>{selectedOption?.label}</span></div>
              ) : (
                <div className="text-sm text-slate-600 opacity-50">
                  {placeholder}
                </div>
              )}
              <div className="absolute right-4 text-slate-500">
                <ArrowIcon />
              </div>
            </Listbox.Button>

            <Listbox.Options
              as="div"
              className="absolute slim-scroll z-20 mt-2 h-auto max-h-[150px] border-solid rounded-[2px] border-[#CBD5E1] border-[1px] w-full space-y-1 overflow-y-auto bg-white p-2 leading-6 focus:outline-none"
            >
              {options?.length ? (
                options.map((option) => {
                  return (
                    <Listbox.Option as={Fragment} key={option.value} value={option.value} >
                      {({ active, selected }) => (
                        <div
                          className={`${selected
                            ? 'border-blue-600 bg-blue-600 text-white'
                            : 'border-white bg-white'
                            } ${!selected && active
                              ? 'border-slate-100 bg-slate-200 active:border-blue-600 active:bg-white active:ring-2 active:ring-blue-300'
                              : ''
                            }
                      relative cursor-pointer select-none overflow-hidden rounded-lg border py-1 px-[8px] text-[12px] transition duration-150 ease-in-out`}
                        >

                          <span>{option.label}</span>
                        </div>
                      )}
                    </Listbox.Option>
                  );
                })
              ) : (
                <span className="p-2 text-gray-500">No options available</span>
              )}
            </Listbox.Options>
          </div>
        )}
      </Listbox>
      <style jsx global>
        {
          `
          ::-webkit-scrollbar {
            width: 6px;
            background: #f7f7f7;
          }

          ::-webkit-scrollbar-track {
            background: transparent;


          }

          ::-webkit-scrollbar-thumb {
            background-color: rgba(155, 155, 155, 0.5);

            border: transparent;


          }

          `
        }
      </style>
    </>
  );
}
