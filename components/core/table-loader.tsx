import React from 'react';

const TableLoader = () => {
  return (
    <div className="loader">
      <div className="spinner"></div>
      <p>Loading more data...</p>
      <style jsx>{`
        .loader {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
          font-size: 14px;
          color: #black;
        }
        .spinner {
          width: 24px;
          height: 24px;
          border: 3px solid rgba(0, 0, 0, 0.1);
          border-top: 3px solid #156FF7;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-right: 10px;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default TableLoader;
