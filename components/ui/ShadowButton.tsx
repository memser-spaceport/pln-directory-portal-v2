'use client';

import { useState } from "react";
import { ButtonHTMLAttributes } from "react";
import Image from "next/image";

/**
 * Props for the ShadowButton component.
 * Extends standard button attributes and adds custom styling and icon options.
 */
interface ShadowButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  buttonColor?: string;
  shadowColor?: string;
  buttonWidth?: string;
  buttonHeight?: string;
  iconSrc?: string;
  iconAlt?: string;
  iconWidth?: number;
  iconHeight?: number;
  iconPosition?: 'left' | 'right';
  textColor?: string;
  children: React.ReactNode;
}

/**
 * ShadowButton component renders a button with a colored shadow and optional icon.
 * Handles hover state for shadow effect and supports left/right icon placement.
 *
 * @component
 * @param {ShadowButtonProps} props - The props for ShadowButton.
 */
export default function ShadowButton({
  buttonColor = "#156FF7",
  shadowColor = "#3DFEB1",
  buttonWidth = "100%",
  buttonHeight = "100%",
  iconSrc,
  iconAlt = "button icon",
  iconWidth = 20,
  iconHeight = 20,
  iconPosition = 'left',
  textColor = "white",
  children,
  ...props
}: ShadowButtonProps) {
  // Track hover state for shadow effect
  const [isHovering, setIsHovering] = useState(false);

  return (
    <div className="button-container">
      {/* Shadow layer behind the button */}
      <div className="button-shadow"></div>
      {/* Main button element */}
      <button
        className="button-main"
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        {...props}
      >
        {/* Optional left icon */}
        {iconSrc && iconPosition === 'left' && (
          <span className="icon-container left">
            <Image src={iconSrc} alt={iconAlt} width={iconWidth} height={iconHeight} />
          </span>
        )}
        {/* Button text/content */}
        <span className="text-content">{children}</span>
        {/* Optional right icon */}
        {iconSrc && iconPosition === 'right' && (
          <span className="icon-container right">
            <Image src={iconSrc} alt={iconAlt} width={iconWidth} height={iconHeight} />
          </span>
        )}
      </button>
      {/* Component styles for layout, shadow, and hover effect */}
      <style jsx>{`
        .button-container {
          position: relative;
          width: ${buttonWidth};
          height: ${buttonHeight};
        }

        .button-shadow {
          position: absolute;
          width: ${buttonWidth};
          height: ${buttonHeight};
          border-radius: 4px;
          background-color: ${shadowColor};
          left: 5px;
          top: 6px;
        }

        .button-main {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          height: 100%;
          padding: 12px 24px;
          border-radius: 4px;
          background-color: ${buttonColor};
          border: 1px solid black;
          transition: transform 0.3s ease-in-out;
          font-family: 'Inter', sans-serif;
          font-size: 14px;
          font-weight: 600;
          line-height: 24px;
          color: ${textColor};
          white-space: nowrap;
          transform: ${isHovering ? "translate(2.5px, 3px)" : "translate(0, 0)"};
        }
      `}</style>
      <style jsx global>{`
        .icon-container {
          display: flex;
          align-items: center;
        }
        
        .icon-container.left {
          margin-right: 8px;
        }
        
        .icon-container.right {
          margin-left: 8px;
        }
        
        .text-content {
          display: flex;
          align-items: center;
        }
      `}</style>
    </div>
  );
} 