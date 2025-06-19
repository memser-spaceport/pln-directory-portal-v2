import React from 'react';

interface URLFieldErrorProps {
  message: string;
  show: boolean;
}

const URLFieldError = ({ message, show }: URLFieldErrorProps): React.ReactElement | null => {
  if (!show) return null;
  
  return (
    <div className="url-error">
      {message}
      
      <style jsx>{`
        .url-error {
          position: absolute;
          bottom: -18px;
          right: 0;
          font-size: 12px;
          color: #ef4444;
          font-weight: 400;
          text-align: right;
        }
      `}</style>
    </div>
  );
};

export default URLFieldError;