import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import CustomToggle from '../../components/form/custom-toggle';
import '@testing-library/jest-dom';

describe('CustomToggle Component', () => {
  it('renders correctly with default props', () => {
    const { getByTestId } = render(<CustomToggle id="toggle1" name="toggle1" />);
    const toggle = getByTestId('toggle1-toggle');
    expect(toggle).toBeInTheDocument();
    expect(toggle).not.toBeChecked();
  });

  it('renders correctly with checked prop', () => {
    const { getByTestId } = render(<CustomToggle id="toggle2" name="toggle2" checked={true} />);
    const toggle = getByTestId('toggle2-toggle');
    expect(toggle).toBeChecked();
  });
  
  it('calls onChange when clicked', () => {
    const handleChange = jest.fn();
    const { getByTestId } = render(<CustomToggle id="toggle4" name="toggle4" onChange={handleChange} />);
    const toggle = getByTestId('toggle4-toggle');
    
    fireEvent.click(toggle);
    expect(handleChange).toHaveBeenCalledTimes(1);
  });
  it('updates checked state when checked prop changes', () => {
    const { rerender, getByTestId } = render(<CustomToggle id="toggle6" name="toggle6" checked={false} />);
    const toggle = getByTestId('toggle6-toggle');
    
    expect(toggle).not.toBeChecked();
    
    rerender(<CustomToggle id="toggle6" name="toggle6" checked={true} />);
    expect(toggle).toBeChecked();
  });

  
  it('handles defaultChecked correctly', () => {
    const { getByTestId } = render(<CustomToggle id="toggle7" name="toggle7" defaultChecked={true} />);
    const toggle = getByTestId('toggle7-toggle');
    expect(toggle).toBeChecked();
  });

  
  it('does not change checked state if checked prop is undefined', () => {
    const { rerender, getByTestId } = render(<CustomToggle id="toggle8" name="toggle8" checked={true} />);
    const toggle = getByTestId('toggle8-toggle');
    
    expect(toggle).toBeChecked();
    
    rerender(<CustomToggle id="toggle8" name="toggle8" />);
    expect(toggle).toBeChecked(); // Should remain checked
  }); 

/* 
  

 


 

  

*/
});

