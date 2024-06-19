'use client'
import { useEffect, useRef } from 'react';

interface HiddenFieldProps {
  value: string;
  defaultValue: string;
  name: string;
}

const HiddenField: React.FC<HiddenFieldProps> = ({value, name, defaultValue = ''}) => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  useEffect(() => {
    if(inputRef.current) {
        inputRef.current.value = value;
    }
  }, [value])
  
  return <input hidden ref={inputRef} name={name} readOnly defaultValue={defaultValue}/>
};

export default HiddenField;
