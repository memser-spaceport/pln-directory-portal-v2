import TextArea from '@/components/form/text-area';
import TextField from '@/components/form/text-field';
import { useEffect, useRef, useState } from 'react';

interface ProjectBasicInfoProps {
  errors: string[];
  project: any;
}

function ProjectGeneralInfo(props: ProjectBasicInfoProps) {
  const errors = props.errors;
  const project = props.project;
  const uploadImageRef = useRef<HTMLInputElement>(null);
  const [profileImage, setProfileImage] = useState<string>(project?.logo);

  const onImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const onDeleteImage = (e: React.PointerEvent<HTMLImageElement>) => {
    e.stopPropagation();
    e.preventDefault();
    setProfileImage('');
    if (uploadImageRef.current) {
      uploadImageRef.current.value = '';
    }
  };

  return (
    <>
      <div className="projectinfo">
        <ul className="projectinfo__errors">
          {errors.map((error: string, index: number) => (
            <li key={`project-error-${index}`}>{error}</li>
          ))}
        </ul>
        <div className="projectinfo__form">
          <div className="projectinfo__form__user">
            <label htmlFor="Project-image-upload" className="projectinfo__form__user__profile">
              {!profileImage && <img width="32" height="32" alt="project-logo" src="/icons/camera.svg" />}
              {!profileImage && <span className="projectinfo__form__user__profile__text">Add Image</span>}
              {profileImage && <img className="projectinfo__form__user__profile__preview" src={profileImage} alt="user profile" width="95" height="95" />}
              {profileImage && (
                <span className="projectinfo__form__user__profile__actions">
                  <img width="32" height="32" title="Change profile image" alt="change image" src="/icons/recycle.svg" />
                  <img onPointerDown={onDeleteImage} width="32" height="32" title="Delete profile image" alt="delete image" src="/icons/trash.svg" />
                </span>
              )}
            </label>
            <input onChange={onImageUpload} id="Project-image-upload" name="ProjectProfile" ref={uploadImageRef} hidden type="file" accept="image/png, image/jpeg" />
            <div className="projectinfo__form__item">
              <TextField pattern="^[a-zA-Z\s]*$" maxLength={64} isMandatory={true} id="add-project-name" label="Project Name*" defaultValue={project.name} name="name" type="text" placeholder="Enter Project Name Here" />
            </div>
          </div>
          <p className="info">
            <img src="/icons/info.svg" alt="name info" width="16" height="16px" /> <span className="info__text">Please upload a image in PNG or JPEG format with file size less than 4MB</span>
           </p>
          <div className="projectinfo__form__item">
            <TextField defaultValue={project.tagline} isMandatory={true} id="register-Project-email" label="Project Tagline*" name="tagline" type="text" placeholder="Enter Your Project Tagline" />
          </div>

          <div className="projectinfo__form__item">
          <TextArea
            defaultValue={project.description}
            maxLength={1000}
            isMandatory
            id="register-project-shortDescription"
            name="description"
            label="Detailed description of your project*"
            placeholder="Enter description of your project"
          />
          <p className="info">
            <img src="/icons/info.svg" alt="name info" width="16" height="16px" /> <span className="info__text">One to two sentences is perfect! Use clear language and minimal jargon.</span>
          </p>
        </div>
        </div>
      </div>
      <style jsx>
        {`
          .info {
            display: flex;
            gap: 4px;
            align-items: center;
            margin-top: 12px;
          }
          .info__text {
            text-align: left;
            font-size: 13px;
            opacity: 0.4;
          }
          .projectinfo__errors {
            color: red;
            font-size: 12px;
            padding: 0 16px 16px 16px;
          }
          .projectinfo__form {
            display: flex;
            flex-direction: column;
          }
          .projectinfo__form__item {
            margin: 10px 0;
            flex: 1;
          }
          .projectinfo__form__item__cn {
            display: flex;
            gap: 10px;
            width: 100%;
          }

          .projectinfo__form__user {
            display: flex;
            gap: 20px;
            width: 100%;
          }
          .projectinfo__form__user__profile {
            width: 100px;
            height: 100px;
            border: 3px solid #cbd5e1;
            background: #f1f5f9;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            border-radius: 50%;
            color: #156ff7;
            font-size: 12px;
            cursor: pointer;
            position: relative;
          }
          .projectinfo__form__user__profile__actions {
            display: flex;
            gap: 10px;
            align-items: center;
            justify-content: center;
            width: 100%;
            height: 100%;
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            border-radius: 50%;
            background: rgb(0, 0, 0, 0.4);
          }

          .projectinfo__form__user__profile__preview {
            border-radius: 50%;
            object-fit: cover;
            object-position: top;
          }
        `}
      </style>
    </>
  );
}

export default ProjectGeneralInfo;
