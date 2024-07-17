'use client';

import { IProjectResponse } from '@/types/project.types';
import { IUserInfo } from '@/types/shared.types';
import AddEditProjectForm from './add-edit-project-form';
import FormStepIndicatorMob from './form-step-indicator-mob';
import { FormStepIndicatorWeb } from './form-step-indicator-web';

interface IAddEditProjectContainer {
  project: IProjectResponse
  type: string;
  userInfo: IUserInfo;
}
export default function AddEditProjectContainer(props: any) {
  const project = props?.project;
  const type = props?.type;
  const userInfo = props?.userInfo;

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
          <AddEditProjectForm type={type} project={project} userInfo={userInfo} />
        </div>
      </div>

      <style jsx>
        {`
          .addEditPc {
            width: 100%;
          }

          .addEditPc__webInd {
            display: none;
          }

          @media (min-width: 1024px) {
            .addEditPc {
              display: flex;
              gap: 24px;
              padding: 24px;
              width: unset;
            }

            .addEditPc__mobInd {
              display: none;
            }

            .addEditPc__webInd {
              display: unset;
              width: 296px;
              border: 1px solid #cbd5e1;
              border-radius: 8px;
              height: fit-content;
              background-color: white;
              padding: 24px 20px 29px 20px;
              position: sticky;
              top: 140px;
            }
          }
        `}
      </style>
    </>
  );
}
