'use client';
import React, { useState, useRef, useEffect, ReactNode } from 'react';

type PaneProps = {
  children: ReactNode;
  position?: 'top' | 'bottom' | 'bottom-right';
};

type WrapperProps = {
  children: ReactNode;
};

// Wrapper component that triggers the dropdown
export const Wrapper: React.FC<WrapperProps> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const togglePopover = () => {
    setIsOpen(!isOpen);
  };

  // Close the dropdown if clicked outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div ref={wrapperRef} className="wrapper">
      <div onClick={togglePopover}>{React.Children.map(children, (child) => ((child as React.ReactElement).type === Pane ? isOpen && child : <div className="trigger">{child}</div>))}</div>
      <style jsx>{`
        .wrapper {
          display: inline-block;
          position: relative;
        }
        .trigger {
          cursor: pointer;
        }
      `}</style>
    </div>
  );
};

// Pane component that displays the dropdown content
export const Pane: React.FC<PaneProps> = ({ children, position = 'bottom' }) => {
  return (
    <div className={`pane ${position}`}>
      {children}
      <style jsx>{`
        .pane {
          position: absolute;
          background: white;
          border-radius: 5px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
          z-index: 0;
        }
        .pane.top {
          bottom: 100%;
          left: 0;
          margin-bottom: 5px;
        }
        .pane.bottom {
          top: 100%;
          left: 0;
          margin-top: 5px;
        }
        .pane.bottom-right {
         top: 100%;
          right: 0;
         
        }
      `}</style>
    </div>
  );
};

export const PopoverDp = {
  Wrapper,
  Pane,
};
