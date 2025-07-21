import React, { PropsWithChildren, ReactNode, useMemo } from 'react';

import { useLockBodyScroll, useToggle } from 'react-use';
import { AnimatePresence, motion } from 'framer-motion';

import s from './CreatePost.module.scss';
import { FormProvider, useForm } from 'react-hook-form';
import { FormSelect } from '@/components/form/FormSelect';
import { useForumTopics } from '@/services/forum/hooks/useForumTopics';
import { FormField } from '@/components/form/FormField';
import { FormEditor } from '@/components/form/FormEditor';

const fade = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

export const CreatePost = ({ renderChildren }: { renderChildren?: (toggle: () => void) => ReactNode }) => {
  const [open, toggleOpen] = useToggle(false);
  useLockBodyScroll(open);

  const { data: topics } = useForumTopics();
  const topicsOptions = useMemo(() => {
    return (
      topics?.map((topic) => ({
        label: topic.name,
        value: topic.cid.toString(),
      })) ?? []
    );
  }, [topics]);

  const methods = useForm({
    defaultValues: {
      topic: null,
      title: '',
      content: '',
    },
  });

  const { handleSubmit, reset } = methods;

  const onSubmit = (data: any) => {
    console.log(data);
  };

  return (
    <>
      {renderChildren ? (
        renderChildren(toggleOpen)
      ) : (
        <button className={s.triggerButton} onClick={toggleOpen}>
          Create post <PlusIcon />
        </button>
      )}

      <AnimatePresence>
        {open && (
          <motion.div className="modal" initial="hidden" animate="visible" exit="exit" variants={fade} transition={{ duration: 0.3 }} style={{ zIndex: 5, position: 'absolute' }}>
            <div className={s.modal}>
              <FormProvider {...methods}>
                <form className={s.modalContent} noValidate onSubmit={handleSubmit(onSubmit)}>
                  <div className={s.header}>
                    <button
                      type="button"
                      className={s.cancelBtn}
                      onClick={() => {
                        toggleOpen(false);
                        reset();
                      }}
                    >
                      Cancel
                    </button>
                    <button className={s.submitBtn}>Post</button>
                  </div>

                  <div className={s.content}>
                    <FormSelect name="topic" placeholder="Select topic" label="Select topic" options={topicsOptions} />
                    <FormField name="title" placeholder="Enter the title" label="Title" />
                    <FormEditor name="content" placeholder="Write your post" label="Post" />
                  </div>
                </form>
              </FormProvider>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

const PlusIcon = () => (
  <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M18.0312 10C18.0312 10.2238 17.9424 10.4384 17.7841 10.5966C17.6259 10.7549 17.4113 10.8438 17.1875 10.8438H11.8438V16.1875C11.8438 16.4113 11.7549 16.6259 11.5966 16.7841C11.4384 16.9424 11.2238 17.0312 11 17.0312C10.7762 17.0312 10.5616 16.9424 10.4034 16.7841C10.2451 16.6259 10.1562 16.4113 10.1562 16.1875V10.8438H4.8125C4.58872 10.8438 4.37411 10.7549 4.21588 10.5966C4.05764 10.4384 3.96875 10.2238 3.96875 10C3.96875 9.77622 4.05764 9.56161 4.21588 9.40338C4.37411 9.24514 4.58872 9.15625 4.8125 9.15625H10.1562V3.8125C10.1562 3.58872 10.2451 3.37411 10.4034 3.21588C10.5616 3.05764 10.7762 2.96875 11 2.96875C11.2238 2.96875 11.4384 3.05764 11.5966 3.21588C11.7549 3.37411 11.8438 3.58872 11.8438 3.8125V9.15625H17.1875C17.4113 9.15625 17.6259 9.24514 17.7841 9.40338C17.9424 9.56161 18.0312 9.77622 18.0312 10Z"
      fill="white"
    />
  </svg>
);
