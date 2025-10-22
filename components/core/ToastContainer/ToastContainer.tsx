'use client';

import { ToastContainer as RTC } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import s from './ToastContainer.module.scss';

const ToastContainer = () => {
  return (
    <RTC
      theme="light"
      position="top-right"
      className={s.root}
      toastClassName={s.toast}
      closeButton={false}
      icon={false}
    />
  );
};

export default ToastContainer;
