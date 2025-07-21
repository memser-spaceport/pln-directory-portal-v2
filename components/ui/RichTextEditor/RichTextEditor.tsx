'use client';

import React from 'react';
import ReactQuill from 'react-quill';
import { clsx } from 'clsx';
import 'react-quill/dist/quill.snow.css';

import s from './RichTextEditor.module.scss';

interface Props {
  value: string;
  onChange: (val: string) => void;
  className?: string;
  errorMessage?: string;
  id?: string;
  disabled?: boolean;
}

const RichTextEditor = ({ value, onChange, className, errorMessage, id, disabled }: Props) => {
  return (
    <div className={s.root} id={id}>
      <ReactQuill theme="snow" value={value} onChange={onChange} className={clsx(s.editor, className)} readOnly={disabled} />
      {errorMessage && <div className={s.error}>{errorMessage}</div>}
    </div>
  );
};

export default RichTextEditor;
