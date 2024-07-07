'use client';

import AddEditProjectForm from './add-edit-project-form';
import FormStepIndicatorMob from './form-step-indicator-mob';
import { FormStepIndicatorWeb } from './form-step-indicator-web';

export default function AddEditProjectContainer(props: any) {
  const project = props?.project;

  return (
    <>
      <div className="addEditPc">
        <div className="addEditPc__mobInd">
          <FormStepIndicatorMob />
        </div>

        <div className="addEditPc__webInd">
          <FormStepIndicatorWeb />
        </div>

        <div className="addEditPc__formCon">
          <AddEditProjectForm />
        </div>
      </div>

      <style jsx>
        {`
        
          .addEditPc {
          }

          .addEditPc__webInd {
            display: none;
          }

          @media (min-width: 1024px) {
            .addEditPc {
              display: flex;
              gap: 24px;
              align-items: center;
            }

            .addEditPc__mobInd {
              display: none;
            }

            .addEditPc__webInd {
              display: unset;
            }
          }
        `}
      </style>
    </>
  );
}
