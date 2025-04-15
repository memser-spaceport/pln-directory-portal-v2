'use client';

import Modal from '@/components/core/modal';
import { EVENTS } from '@/utils/constants';
import { useEffect, useRef, useState } from 'react';

interface Topic {
  id?: string;
  name: string;
}

export default function AddEditTopicModal() {
  const modalRef = useRef<HTMLDialogElement>(null);
  const [mode, setMode] = useState<'add' | 'edit'>('add');
  const [topicName, setTopicName] = useState('');
  const [topic, setTopic] = useState<Topic | null>(null);

  const onClose = () => {
    if (modalRef.current) {
      modalRef.current.close();
      setTopicName('');
    }
  };

  useEffect(() => {
    document.addEventListener(EVENTS.ADD_EDIT_TOPIC_MODAL, (event: any) => {
      setMode(event.detail.mode);
      if (event.detail.topic) {
        setTopic(event.detail.topic);
        setTopicName(event.detail.topic.name);
      } else {
        setTopic(null);
        setTopicName('');
      }
      if (modalRef.current) {
        modalRef.current.showModal();
      }
    });
    return () => {
      document.removeEventListener(EVENTS.ADD_EDIT_TOPIC_MODAL, () => {});
    };
  }, []);

  const handleSubmit = () => {
    // onSubmit({
    //   id: topic?.id,
    //   name: topicName
    // });
    onClose();
  };

  return (
    <Modal
      modalRef={modalRef}
      onClose={onClose}
    >
      <div className="add-edit-topic">
        <div className="add-edit-topic__header">
          <h2 className="add-edit-topic__title">
            {mode === 'add' ? 'Add New Topic' : 'Edit Topic'}
          </h2>
        </div>

        <div className="add-edit-topic__form">
          <div className="add-edit-topic__field">
            <label>Topic Name</label>
            <input 
              type="text" 
              value={topicName}
              onChange={(e) => setTopicName(e.target.value)}
              placeholder="Enter topic name"
            />
          </div>
        </div>

        <div className="add-edit-topic__actions">
          <button onClick={onClose} className="add-edit-topic__cancel">
            Cancel
          </button>
          <button 
            onClick={handleSubmit} 
            className="add-edit-topic__submit"
            disabled={!topicName.trim()}
          >
            {mode === 'add' ? 'Add Topic' : 'Save Changes'}
          </button>
        </div>

        <style jsx>{`
          .add-edit-topic {
            display: flex;
            flex-direction: column;
            gap: 18px;
            padding: 24px;
            width: 80vw;
            max-width: 656px;
            min-width: 320px;
          }

          .add-edit-topic__header {
            display: flex;
            justify-content: space-between;
            align-items: center;
          }

          .add-edit-topic__title {
            font-size: 18px;
            font-weight: 600;
            color: #1E293B;
            margin: 0;
          }

          .add-edit-topic__form {
            display: flex;
            flex-direction: column;
            gap: 16px;
            width: 100%;
          }

          .add-edit-topic__field {
            display: flex;
            flex-direction: column;
            gap: 8px;
          }

          .add-edit-topic__field label {
            font-size: 14px;
            color: #1E293B;
            font-weight: 500;
          }

          .add-edit-topic__field input {
            padding: 8px 12px;
            border: 1px solid #CBD5E1;
            border-radius: 8px;
            font-size: 14px;
            color: #1E293B;
            outline: none;
          }

          .add-edit-topic__field input::placeholder {
            color: #64748B;
          }

          .add-edit-topic__actions {
            display: flex;
            justify-content: flex-end;
            gap: 12px;
            padding-top: 8px;
          }

          .add-edit-topic__cancel {
            padding: 8px 16px;
            border: 1px solid #CBD5E1;
            border-radius: 8px;
            background: white;
            color: #0F172A;
            font-size: 14px;
            cursor: pointer;
          }

          .add-edit-topic__submit {
            padding: 8px 16px;
            background: #0066FF;
            color: white;
            border: none;
            border-radius: 8px;
            font-size: 14px;
            cursor: pointer;
          }

          .add-edit-topic__submit:disabled {
            background: #CBD5E1;
            cursor: not-allowed;
          }
        `}</style>
      </div>
    </Modal>
  );
} 