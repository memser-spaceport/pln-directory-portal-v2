'use client';

import Modal from '@/components/core/modal';
import { EVENTS } from '@/utils/constants';
import { useEffect, useRef, useState, useTransition } from 'react';
import TextField from '@/components/form/text-field';
import MonthYearPicker from '@/components/form/month-year-picker';
import Toggle from '@/components/ui/toogle';
import { useFormState } from 'react-dom';
import { MemberExperienceFormAction } from '@/app/actions/members.experience.actions';
import { toast } from 'react-toastify';
import { triggerDialogLoader } from '@/utils/common.utils';
import { useRouter } from 'next/navigation';
import { useMemberAnalytics } from '@/analytics/members.analytics';
import HiddenField from '@/components/form/hidden-field';
import RichTextEditor from '@/components/ui/RichTextEditor/RichTextEditor';
interface Experience {
  uid?: string;
  memberId?: string;
  title?: string;
  company?: string;
  startDate?: Date;
  endDate?: Date | null;
  isCurrent?: boolean;
  location?: string;
  description?: string;
}

export default function AddEditExperienceModal({ member, userInfo }: { member: any; userInfo: any }) {
  const modalRef = useRef<HTMLDialogElement>(null);
  const initialState = { success: false, message: '', errorCode: '', errors: {} };
  const router = useRouter();

  const experienceRef = useRef<Experience>({});
  const analytics = useMemberAnalytics();

  const [errors, setErrors] = useState<any>({});
  const [isConfirming, setIsConfirming] = useState(false);
  const [formActionType, setFormActionType] = useState('save');
  const formRef = useRef<HTMLFormElement>(null);
  const [forceUpdate, setForceUpdate] = useState(0);

  const [state, formAction] = useFormState(MemberExperienceFormAction, initialState);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (formData: any) => {
    startTransition(() => {
      formAction(formData);
    });
  };

  useEffect(() => {
    isPending ? triggerDialogLoader(true) : triggerDialogLoader(false);
  }, [isPending]);

  useEffect(() => {
    const handler = (e: any) => {
      const exp = e.detail?.experience || {};

      experienceRef.current = exp;

      setErrors({});
      formRef.current?.reset();
      setTimeout(() => modalRef.current?.showModal(), 0);
    };

    document.addEventListener(EVENTS.TRIGGER_ADD_EDIT_EXPERIENCE_MODAL, handler);
    return () => document.removeEventListener(EVENTS.TRIGGER_ADD_EDIT_EXPERIENCE_MODAL, handler);
  }, []);

  const closeModal = () => {
    modalRef.current?.close();
    experienceRef.current = {};
    formRef.current?.reset();
    setIsConfirming(false);
  };

  useEffect(() => {
    if (state?.success) {
      closeModal();
      router.refresh();
      toast.success(state?.message);
      if (formActionType === 'save') {
        if (isEdit) {
          analytics.onEditExperienceSaveClicked(userInfo, member, experienceRef.current, 'success');
        } else {
          analytics.onAddExperienceSaveClicked(userInfo, member, experienceRef.current, 'success');
        }
      } else if (formActionType === 'delete') {
        analytics.onDeleteExperienceSaveClicked(userInfo, member, experienceRef.current, 'success');
      }
    } else if (state?.errorCode === 'validation') {
      setErrors(state?.errors);
      if (formActionType === 'save') {
        if (isEdit) {
          analytics.onEditExperienceSaveClicked(userInfo, member, experienceRef.current, 'validation-error');
        } else {
          analytics.onAddExperienceSaveClicked(userInfo, member, experienceRef.current, 'validation-error');
        }
      }
    } else {
      if (state?.message) {
        closeModal();
        toast.error(state?.message);
        router.refresh();
        if (formActionType === 'save') {
          if (isEdit) {
            analytics.onEditExperienceSaveClicked(userInfo, member, experienceRef.current, 'error');
          } else {
            analytics.onAddExperienceSaveClicked(userInfo, member, experienceRef.current, 'error');
          }
        } else if (formActionType === 'delete') {
          analytics.onDeleteExperienceSaveClicked(userInfo, member, experienceRef.current, 'error');
        }
      }
    }
  }, [state, router]);

  const handleDelete = async () => {
    if (isConfirming) {
      await setFormActionType('delete');
      formRef.current?.requestSubmit();
    } else {
      setIsConfirming(true);
    }
  };

  const handleSave = async () => {
    await setFormActionType('save');
    formRef.current?.requestSubmit();
  };

  // Helper to update experience ref
  const updateExperience = (key: string, value: any) => {
    if (key === 'startDate' || key === 'endDate' || key === 'description') {
      setForceUpdate((prev) => prev + 1);
    }
    experienceRef.current = {
      ...experienceRef.current,
      [key]: value,
    };
  };

  const isEdit = !!experienceRef.current?.uid;

  return (
    <Modal modalRef={modalRef} onClose={closeModal}>
      <form className="add-edit-experience__modal" action={handleSubmit} autoComplete="off" noValidate ref={formRef}>
        {experienceRef.current?.uid && <input type="hidden" name="experience-uid" value={experienceRef.current.uid} />}
        <input type="hidden" name="actionType" value={formActionType} />
        {experienceRef.current?.memberId && <input type="hidden" name="memberId" value={experienceRef.current.memberId} />}
        <div className="add-edit-experience__modal__header">
          <h2>{isEdit ? 'Edit' : 'Add'} Experience</h2>
        </div>
        <div className="add-edit-experience__modal__body">
          <TextField label="Role*" defaultValue={experienceRef.current?.title || ''} type="text" name="experience-title" required={true} id="experience-title" placeholder="Enter role" />
          {errors.title && <span className="error-text">{errors.title}</span>}

          <TextField
            label="Team or Organization*"
            defaultValue={experienceRef.current?.company || ''}
            type="text"
            name="experience-company"
            required={true}
            id="experience-company"
            placeholder="Enter team or organization"
          />
          {errors.company && <p className="error-text">{errors.company}</p>}

          <div className="add-edit-experience__modal__description">
            <label className="add-edit-experience__modal__description__label">Impact or Work Description</label>
            <RichTextEditor value={experienceRef.current?.description || ''} onChange={(value: string) => updateExperience('description', value)} />
            <HiddenField value={experienceRef.current?.description || ''} defaultValue={experienceRef.current?.description || ''} name={`description`} />
          </div>
          {errors.description && <p className="error-text">{errors.description}</p>}

          <div className="add-edit-experience__modal__dates">
            <MonthYearPicker
              onDateChange={(value: string) => updateExperience('startDate', value)}
              id={`add-edit-experience-startDate`}
              dayValue="start"
              name={`add-edit-experience-startDate`}
              label="Start Date"
              isOptional={false}
              minYear={1970}
              sort="desc"
              maxYear={new Date().getFullYear()}
              initialDate={experienceRef.current?.startDate ? new Date(experienceRef.current?.startDate).toISOString() : undefined}
            />
            <MonthYearPicker
              onDateChange={(value: string) => updateExperience('endDate', value)}
              id={`add-edit-experience-endDate`}
              dayValue="end"
              name={`add-edit-experience-endDate`}
              label="End Date"
              isOptional={true}
              minYear={1970}
              sort="desc"
              maxYear={new Date().getFullYear()}
              initialDate={experienceRef?.current?.isCurrent ? undefined : experienceRef?.current?.endDate ? new Date(experienceRef.current?.endDate).toISOString() : undefined}
            />
            <div className="add-edit-experience__modal__dates__current">
              <span>Present</span>
              <Toggle
                height="16px"
                width="28px"
                callback={(e) => {
                  const isCurrent = e.target.checked;
                  updateExperience('isCurrent', isCurrent);
                  updateExperience('endDate', isCurrent ? null : experienceRef.current?.startDate);
                  setForceUpdate((prev) => prev + 1);
                }}
                isChecked={experienceRef?.current?.isCurrent || false}
              />
              <input type="hidden" name="isCurrent" value={experienceRef.current?.isCurrent ? 'true' : 'false'} />
            </div>
          </div>
          {errors.startDate && <p className="error-text">{errors.startDate}</p>}
          {errors.endDate && <p className="error-text">{errors.endDate}</p>}
          <TextField label="Location" defaultValue={experienceRef.current?.location || ''} type="text" placeholder="Enter location" name="experience-location" id="experience-location" />
          {errors.location && <p className="error-text">{errors.location}</p>}
        </div>
        <div className="add-edit-experience__modal__footer">
          {isEdit && (
            <button type="button" className="delete-btn" onClick={handleDelete}>
              {isConfirming ? 'Confirm ?' : 'Delete'}
            </button>
          )}
          <button type="button" className="cancel-btn" onClick={closeModal}>
            Cancel
          </button>
          <button type="button" className="save-btn" style={{ background: '#156ff7', color: '#fff' }} onClick={handleSave}>
            Save
          </button>
        </div>
        <style jsx>{`
          .add-edit-experience__modal {
            width: 90vw;
            max-width: 656px;
            background: #fff;
            border-radius: 8px;
            padding: 24px;
            display: flex;
            flex-direction: column;
            gap: 16px;
          }
          .add-edit-experience__modal__header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 12px;
          }
          .add-edit-experience__modal__close {
            background: none;
            border: none;
            cursor: pointer;
          }
          .add-edit-experience__modal__body {
            display: flex;
            flex-direction: column;
            gap: 16px;
          }
          .add-edit-experience__modal__body label {
            display: flex;
            flex-direction: column;
            font-size: 14px;
            font-weight: 500;
            margin-bottom: 12px;
            gap: 4px;
          }

          .add-edit-experience__modal__description__label {
            font-weight: 600 !important;
            font-size: 14px;
          }

          .add-edit-experience__modal__body input,
          .add-edit-experience__modal__body select {
            padding: 8px;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            font-size: 14px;
            margin-top: 2px;
          }
          .add-edit-experience__modal__body input.error,
          .add-edit-experience__modal__body select.error {
            border-color: red;
          }
          .error-text {
            color: red;
            font-size: 12px;
          }
          .add-edit-experience__modal__dates {
            display: flex;
            flex-direction: row;
            flex-wrap: wrap;
            gap: 24px;
            width: 100%;
            position: relative;
          }
          .add-edit-experience__modal__date-row {
            display: flex;
            gap: 8px;
            align-items: center;
          }
          .present-toggle {
            display: flex;
            align-items: center;
            gap: 4px;
            font-size: 13px;
            margin-left: 8px;
          }
          .add-edit-experience__modal__footer {
            display: flex;
            justify-content: flex-end;
            gap: 12px;
            margin-top: 16px;
          }
          .delete-btn {
            background: #dd2c5a;
            color: #fff;
            border: none;
            border-radius: 8px;
            padding: 8px 16px;
            font-weight: 500;
            font-size: 14px;
            line-height: 20px;
            margin-right: auto;
            box-shadow: 0px 1px 1px 0px #0f172a14;
          }
          .cancel-btn {
            background: #fff;
            color: #0f172a;
            border: 1px solid #cbd5e1;
            border-radius: 8px;
            padding: 8px 16px;
            font-weight: 500;
            font-size: 14px;
            line-height: 20px;
            box-shadow: 0px 1px 1px 0px #0f172a14;
          }
          .save-btn {
            background: #156ff7;
            color: #fff;
            border: 1px solid #cbd5e1;
            border-radius: 8px;
            padding: 8px 16px;
            font-weight: 500;
            font-size: 14px;
            line-height: 20px;
            box-shadow: 0px 1px 1px 0px #0f172a14;
          }
          .add-edit-experience__modal__dates__current {
            display: flex;
            align-items: center;
            gap: 4px;
            font-size: 13px;
            margin-left: 8px;
            position: absolute;
            top: 0;
            right: 0;
          }
          @media (max-width: 768px) {
            .add-edit-experience__modal {
              padding: 16px;
            }

            .add-edit-experience__modal__footer {
              flex-wrap: wrap;
            }

            .delete-btn,
            .cancel-btn,
            .save-btn {
              padding: 8px 12px;
              font-size: 12px;
            }
          }
        `}</style>
      </form>
    </Modal>
  );
}
