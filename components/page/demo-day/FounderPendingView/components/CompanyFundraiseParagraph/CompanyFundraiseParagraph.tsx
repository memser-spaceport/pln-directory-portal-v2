import React, { useState } from 'react';
import s from './CompanyFundraiseParagraph.module.scss';

interface CompanyFundraiseParagraphProps {
  paragraph?: string | null;
  editable?: boolean;
}

export const CompanyFundraiseParagraph: React.FC<CompanyFundraiseParagraphProps> = ({
  paragraph,
  editable = false,
}) => {
  const [isEditMode, setIsEditMode] = useState(false);

  const handleEditClick = () => {
    setIsEditMode(true);
  };

  // TODO: Add edit form view
  if (isEditMode) {
    return (
      <div className={s.container}>
        <div className={s.header}>
          <h3 className={s.subtitle}>Company paragraph for fundraise</h3>
        </div>
        <div className={s.content}>
          <p className={s.text}>Edit mode - to be implemented</p>
        </div>
      </div>
    );
  }

  return (
    <div className={s.container}>
      <div className={s.header}>
        <h3 className={s.subtitle}>Company paragraph for fundraise</h3>
        {editable && (
          <button className={s.editButton} onClick={handleEditClick}>
            <EditIcon />
            <span>Edit</span>
          </button>
        )}
      </div>
      <div className={s.content}>
        <p className={s.text}>{paragraph || 'No fundraise paragraph yet.'}</p>
      </div>
    </div>
  );
};

const EditIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M8.25 3H3a1.5 1.5 0 0 0-1.5 1.5v10.5A1.5 1.5 0 0 0 3 16.5h10.5a1.5 1.5 0 0 0 1.5-1.5V9.75M6.75 11.25h2.25L16.5 3.75a1.5 1.5 0 0 0-2.25-2.25L6.75 9v2.25Z"
      stroke="#1B4DFF"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
