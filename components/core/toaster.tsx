'use client';

import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const Toaster = () => {
  return (
    <>
      <ToastContainer
        position="top-right"
        theme="dark"
        bodyClassName="toast__body"
        className="toast__class"
        toastClassName="toast__toaster"
        progressClassName="toast_progress"
      />
    </>
  );
};

export default Toaster;
