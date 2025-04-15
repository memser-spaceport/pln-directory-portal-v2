'use client';

import Modal from '@/components/core/modal';
import { EVENTS } from '@/utils/constants';
import { useEffect, useRef, useState } from 'react';

interface Tag {
  id?: string;
  name: string;
}

export default function AddEditTagModal() {
  const modalRef = useRef<HTMLDialogElement>(null);
  const [mode, setMode] = useState<'add' | 'edit'>('add');
  const [tagName, setTagName] = useState('');
  const [tag, setTag] = useState<Tag | null>(null);

  const onClose = () => {
    if (modalRef.current) {
      modalRef.current.close();
      setTagName('');
    }
  };

  useEffect(() => {
    document.addEventListener(EVENTS.ADD_EDIT_TAG_MODAL, (event: any) => {
      setMode(event.detail.mode);
      if (event.detail.tag) {
        setTag(event.detail.tag);
        setTagName(event.detail.tag.name);
      } else {
        setTag(null);
        setTagName('');
      }
      if (modalRef.current) {
        modalRef.current.showModal();
      }
    });
    return () => {
      document.removeEventListener(EVENTS.ADD_EDIT_TAG_MODAL, () => {});
    };
  }, []);

  const handleSubmit = () => {
    // onSubmit({
    //   id: tag?.id,
    //   name: tagName
    // });
    onClose();
  };

  return (
    <Modal
      modalRef={modalRef}
      onClose={onClose}
    >
      <div className="add-edit-tag">
        <div className="add-edit-tag__header">
          <h2 className="add-edit-tag__title">
            {mode === 'add' ? 'Add New Tag' : 'Edit Tag'}
          </h2>
        </div>

        <div className="add-edit-tag__form">
          <div className="add-edit-tag__field">
            <label>Tag Name</label>
            <input 
              type="text" 
              value={tagName}
              onChange={(e) => setTagName(e.target.value)}
              placeholder="Enter tag name"
            />
          </div>
        </div>

        <div className="add-edit-tag__actions">
          <button onClick={onClose} className="add-edit-tag__cancel">
            Cancel
          </button>
          <button 
            onClick={handleSubmit} 
            className="add-edit-tag__submit"
            disabled={!tagName.trim()}
          >
            {mode === 'add' ? 'Add Tag' : 'Save Changes'}
          </button>
        </div>

        <style jsx>{`
          .add-edit-tag {
            display: flex;
            flex-direction: column;
            gap: 18px;
            padding: 24px;
            width: 80vw;
            max-width: 656px;
            min-width: 320px;
          }

          .add-edit-tag__header {
            display: flex;
            justify-content: space-between;
            align-items: center;
          }

          .add-edit-tag__title {
            font-size: 18px;
            font-weight: 600;
            color: #1E293B;
            margin: 0;
          }

          .add-edit-tag__form {
            display: flex;
            flex-direction: column;
            gap: 16px;
            width: 100%;
          }

          .add-edit-tag__field {
            display: flex;
            flex-direction: column;
            gap: 8px;
          }

          .add-edit-tag__field label {
            font-size: 14px;
            color: #1E293B;
            font-weight: 500;
          }

          .add-edit-tag__field input {
            padding: 8px 12px;
            border: 1px solid #CBD5E1;
            border-radius: 8px;
            font-size: 14px;
            color: #1E293B;
            outline: none;
          }

          .add-edit-tag__field input::placeholder {
            color: #64748B;
          }

          .add-edit-tag__actions {
            display: flex;
            justify-content: flex-end;
            gap: 12px;
            padding-top: 8px;
          }

          .add-edit-tag__cancel {
            padding: 8px 16px;
            border: 1px solid #CBD5E1;
            border-radius: 8px;
            background: white;
            color: #0F172A;
            font-size: 14px;
            cursor: pointer;
          }

          .add-edit-tag__submit {
            padding: 8px 16px;
            background: #0066FF;
            color: white;
            border: none;
            border-radius: 8px;
            font-size: 14px;
            cursor: pointer;
          }

          .add-edit-tag__submit:disabled {
            background: #CBD5E1;
            cursor: not-allowed;
          }
        `}</style>
      </div>
    </Modal>
  );
} 