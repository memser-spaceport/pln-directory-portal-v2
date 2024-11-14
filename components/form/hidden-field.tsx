// This component renders a hidden input field that can be used to store values without displaying them to the user.
// It accepts a value, a default value, and a name for the input field.

'use client'
import { useEffect, useRef } from 'react';

interface HiddenFieldProps {
  value?: string; 
  defaultValue: string;
  name: string;
}

const HiddenField: React.FC<HiddenFieldProps> = ({value = '', name, defaultValue = ''}) => {
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if(inputRef.current) {
      inputRef.current.value = value; // Update the input value when the value prop changes
    }
  }, [value]);
  
  return <input hidden ref={inputRef} name={name} readOnly defaultValue={defaultValue} data-testid="hidden-field" />; // Added data-testid for testing
};

export default HiddenField;
