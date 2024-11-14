'use client';

import { IProjectResponse } from '@/types/project.types';
import { IUserInfo } from '@/types/shared.types';
import AddEditProjectForm from './add-edit-project-form';
import FormStepIndicatorMob from './form-step-indicator-mob';
import { FormStepIndicatorWeb } from './form-step-indicator-web';

interface IAddEditProjectContainerProps {
  project: IProjectResponse;
  type: string;
  userInfo: IUserInfo;
}

/**
 * Renders the AddEditProjectContainer component.
 * @param {IAddEditProjectContainerProps} props - The properties for the component.
 * @returns {JSX.Element} The rendered component.
 */
export default function AddEditProjectContainer(props: any): JSX.Element {
  const { project, type, userInfo } = props;

  return (
    <>
      <div className="add-edit-project">
        <div className="add-edit-project__indicator--mobile">
          <FormStepIndicatorMob />
        </div>

        <div className="add-edit-project__indicator--web">
          <FormStepIndicatorWeb />
        </div>

        <div className="add-edit-project__form-container">
          <AddEditProjectForm type={type} project={project} userInfo={userInfo} />
        </div>
      </div>

      <style jsx>
        {`
          .add-edit-project {
            width: 100%;
          }

          .add-edit-project__indicator--web {
            display: none;
          }

          @media (min-width: 1024px) {
            .add-edit-project {
              display: flex;
              gap: 24px;
              padding: 24px;
              width: unset;
            }

            .add-edit-project__indicator--mobile {
              display: none;
            }

            .add-edit-project__indicator--web {
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
