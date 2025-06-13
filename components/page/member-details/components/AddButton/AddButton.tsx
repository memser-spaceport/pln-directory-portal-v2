import React from 'react';

import s from './AddButton.module.scss';

interface Props {
  onClick: () => void;
}

export const AddButton = ({ onClick }: Props) => {
  return (
    <button onClick={onClick} className={s.root}>
      <AddIcon /> Add
    </button>
  );
};

const AddIcon = () => (
  <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ transform: 'translateY(-1px)' }}>
    <path
      d="M14.3438 7.09375C14.6992 7.09375 15 7.39453 15 7.75C15 8.13281 14.6992 8.40625 14.3438 8.40625H8.65625V14.0938C8.65625 14.4766 8.35547 14.75 7.97266 14.75C7.61719 14.75 7.31641 14.4766 7.31641 14.0938V8.40625H1.62891C1.27344 8.40625 0.972656 8.13281 0.972656 7.75C0.972656 7.39453 1.27344 7.09375 1.62891 7.09375H7.31641V1.40625C7.31641 1.05078 7.61719 0.75 7.97266 0.75C8.35547 0.75 8.65625 1.05078 8.65625 1.40625V7.09375H14.3438Z"
      fill="#156FF7"
    />
  </svg>
);
