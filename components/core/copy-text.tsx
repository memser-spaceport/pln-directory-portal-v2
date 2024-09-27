'use client';

import { useState } from 'react';
interface CopyTextProps {
  textToCopy: string;
  children: any;
  onCopyCallback?: (answer: string) => Promise<void>
}
const CopyText = ({ textToCopy, children, onCopyCallback }: CopyTextProps) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    // Copy text to clipboard
    await navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    console.log(typeof onCopyCallback)
    if(onCopyCallback) {
      await onCopyCallback(textToCopy);
    }
    // Hide the message after 3 seconds
    setTimeout(() => {
      setCopied(false);
    }, 1500);
  };

  return (
    <>
      <div className="cn" onClick={handleCopy}>
        {children}
        {copied && <span className="cn__copied">Copied!</span>}
      </div>
      <style jsx>{`
        .cn {
          position: relative;
          cursor: pointer;
          height: auto;
          width:auto;
        }
        .cn__copied {
          position: absolute;
          bottom: -25px;
          left: 16px;
          padding: 4px 8px;
          font-size: 12px;
          background: black;
          color: white;
          border-radius: 8px;
        }
      `}</style>
    </>
  );
};

export default CopyText;
