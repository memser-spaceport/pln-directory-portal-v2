import Modal from '@/components/core/modal';
import { EVENTS } from '@/utils/constants';
import { useEffect, useRef, useState } from 'react';
import TextField from '@/components/form/text-field';
import MonthYearPicker from '@/components/form/month-year-picker';
import Toggle from '@/components/ui/toogle';
import { useFormState } from 'react-dom';
import { MemberExperienceFormAction } from '@/app/actions/members.experience.actions';
import { toast } from 'react-toastify';
import { triggerLoader } from '@/utils/common.utils';
import { useRouter } from 'next/navigation';

export default function AddEditExperienceModal() {
  const modalRef = useRef<HTMLDialogElement>(null);
  const initialState = { success: false, message: '', errorCode: '', errors: {} }
  const router = useRouter();

  // Form state
  const [isEdit, setIsEdit] = useState(false);
  const [experience, setExperience] = useState<any>({});
  const [errors, setErrors] = useState<any>({});
  const [isConfirming, setIsConfirming] = useState(false);
  const [formActionType, setFormActionType] = useState('save');
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction] = useFormState(async (prevState: any, formData: any) => {
    triggerLoader(true);
    const result = await MemberExperienceFormAction(prevState, formData);
    triggerLoader(false);
    return result;
  }, initialState)


  useEffect(() => {
    const handler = (e: any) => {
      setExperience({});
      const exp = e.detail?.experience;
      
      exp['startDate'] = getDateFromMonthYear(exp?.start?.month, exp?.start?.year);
      exp['endDate'] = exp?.isCurrent ? null : getDateFromMonthYear(exp?.end?.month, exp?.end?.year);
      setExperience(exp);
      setIsEdit(!!exp?.uid);
      setErrors({});
      setTimeout(() => modalRef.current?.showModal(), 0);
    };
    document.addEventListener(EVENTS.TRIGGER_ADD_EDIT_EXPERIENCE_MODAL, handler);
    return () => document.removeEventListener(EVENTS.TRIGGER_ADD_EDIT_EXPERIENCE_MODAL, handler);
  }, []);

  const getDateFromMonthYear = (month: number, year: number) => {
    console.log(experience);
    if(month === 0 && year === 0) return new Date().toISOString();
    return new Date(year, month, 1).toISOString();
  };

  const closeModal = () => {
    modalRef.current?.close();
    setExperience({});
    formRef.current?.reset();
    setIsConfirming(false);
  };

  useEffect(() => {
    if(state?.success){
      closeModal();
      router.refresh();
      toast.success(state?.message);
    }else if(state?.errorCode === 'validation'){
      setErrors(state?.errors);
    }else{
      if(state?.message){
        closeModal();
        toast.error(state?.message);
      }
    }
    triggerLoader(false);
  }, [state]);

  const handleDelete = async () => {
    if(isConfirming) {
      await setFormActionType('delete');
      triggerLoader(true);
      formRef.current?.requestSubmit();
    }else{
      setIsConfirming(true);
    }
  };

  const handleSave = async () => {
    triggerLoader(true);
    await setFormActionType('save');
    formRef.current?.requestSubmit();
  };

  return (
    <Modal modalRef={modalRef} onClose={closeModal}>
      <form className="add-edit-experience__modal" action={formAction} autoComplete="off" noValidate ref={formRef}>
        {experience?.uid && <input type="hidden" name="experience-uid" value={experience?.uid} />}
        <input type="hidden" name="actionType" value={formActionType} />
        {experience?.memberId && <input type="hidden" name="memberId" value={experience?.memberId} />}  
        <div className="add-edit-experience__modal__header">
          <h2>{isEdit ? 'Edit' : 'Add'} Experience</h2>
        </div>
        <div className="add-edit-experience__modal__body">
          <TextField
            label="Title*"
            value={experience?.title || ''}
            defaultValue={experience?.title || ''}
            type="text"
            name="experience-title"
            required={true}
            id="experience-title"
            placeholder="Enter title"
          />
          {errors.title && <span className="error-text">{errors.title}</span>}

          <TextField
            label="Company or Organization*"
            value={experience?.company || ''}
            defaultValue={experience?.company || ''}
            type="text"
            name="experience-company"
            required={true}
            id="experience-company"
            onChange={(e) => {
              console.log(e.target.value);
              setExperience({ ...experience, company: e.target.value });
            }}
            placeholder="Enter company or organization"
          />
          {errors.company && <p className="error-text">{errors.company}</p>}

          <div className="add-edit-experience__modal__dates">
            <MonthYearPicker
              onDateChange={(value: string) => setExperience({ ...experience, startDate: value })}
              id={`add-edit-experience-startDate`}
              dayValue="start"
              name={`add-edit-experience-startDate`}
              label="Start Date"
              isOptional={false}
              minYear={1970}
              maxYear={new Date().getFullYear()}
              initialDate={experience?.startDate}
            />
            <MonthYearPicker
              onDateChange={(value: string) => setExperience({ ...experience, endDate: value })}
              id={`add-edit-experience-endDate`}
              dayValue="end"
              name={`add-edit-experience-endDate`}
              label="End Date"
              isOptional={true}
              minYear={1970}
              maxYear={new Date().getFullYear()}
              initialDate={experience?.isCurrent ? null : experience?.endDate}
            />
            <div className="add-edit-experience__modal__dates__current">
              <span>Present</span>
              <Toggle
                height="16px"
                width="28px"
                callback={(e) => {
                  setExperience({ ...experience, isCurrent: e.target.checked, endDate: e.target.checked ? null : getDateFromMonthYear(experience?.end?.month, experience?.end?.year) });
                }}
                isChecked={experience?.isCurrent}
              />
              <input type="hidden" name="isCurrent" value={experience?.isCurrent ? 'true' : 'false'} />
            </div>

          </div>
            {errors.startDate && <p className="error-text">{errors.startDate}</p>}
            {errors.endDate && <p className="error-text">{errors.endDate}</p>}
          <TextField
            label="Location"
            value={experience?.location || ''}
            defaultValue={experience?.location || ''}
            type="text"
            placeholder="Enter location"
            name="experience-location"
            id="experience-location"
          />
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
          <button type="button" className="save-btn"
           style={{ background: '#156ff7', color: '#fff' }}
           onClick={handleSave}
          >
            Save
          </button>
        </div>
        <style jsx>{`
          .add-edit-experience__modal {
            width: 656px;
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
            background: #DD2C5A;
            color: #fff;
            border: none;
            border-radius: 8px;
            padding: 8px 16px;
            font-weight: 500;
            font-size: 14px;
            line-height: 20px;
            margin-right: auto;
            box-shadow: 0px 1px 1px 0px #0F172A14;
          }
          .cancel-btn {
            background: #fff;
            color: #0F172A;
            border: 1px solid #CBD5E1;
            border-radius: 8px;
            padding: 8px 16px;
            font-weight: 500;
            font-size: 14px;
            line-height: 20px;
            box-shadow: 0px 1px 1px 0px #0F172A14;
          }
          .save-btn {
            background: #156ff7;
            color: #fff;
            border: 1px solid #CBD5E1;
            border-radius: 8px;
            padding: 8px 16px;
            font-weight: 500;
            font-size: 14px;
            line-height: 20px;
            box-shadow: 0px 1px 1px 0px #0F172A14;
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
        `}</style>
      </form>
    </Modal>
  );
}
