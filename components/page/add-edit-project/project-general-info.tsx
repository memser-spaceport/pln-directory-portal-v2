import CustomToggle from '@/components/form/custom-toogle';
import TextArea from '@/components/form/text-area';
import TextField from '@/components/form/text-field';
import Toggle from '@/components/form/toggle';
import Image from 'next/image';
import { ChangeEvent, useEffect, useRef, useState } from 'react';

interface ProjectBasicInfoProps {
  errors: string[];
  project: any;
}

function ProjectGeneralInfo(props: ProjectBasicInfoProps) {
  const errors = props.errors;
  const project = props.project;
  const uploadImageRef = useRef<HTMLInputElement>(null);
  const [profileImage, setProfileImage] = useState<string>(project?.logo);

  const [projectLinks, setProjectLinks] = useState(project?.projectLinks);

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

  const onProjectLinkUrlChange = (index: number, value: string) => {
    setProjectLinks((old: any) => {
      old[index].url = value;
      return [...old];
    });
  };

  const onProjectLinkTextChange = (index: number, value: string) => {
    setProjectLinks((old: any) => {
      old[index].text = value;
      return [...old];
    });
  };

  const onDeleteProjectLink = (index: number) => {
    setProjectLinks((old: any) => {
      const newLinks = [...old];
      newLinks.splice(index, 1);
      return newLinks;
    });
  };

  const onAddProjectLink = () => {
    setProjectLinks((v: any) => {
      const nv = structuredClone(v);
      nv.push({ text: '', url: '' });
      return nv;
    });
  };

  console.log('error is', errors);

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
            <input onChange={onImageUpload} id="Project-image-upload" name="projectProfile" ref={uploadImageRef} hidden type="file" accept="image/png, image/jpeg" />
            <div className="projectinfo__form__item">
              <TextField
                pattern="^[a-zA-Z\s]*$"
                maxLength={64}
                isMandatory={true}
                id="add-project-name"
                label="Project Name*"
                defaultValue={project.name}
                name="name"
                type="text"
                placeholder="Enter Project Name Here"
              />
            </div>
          </div>
          <p className="info">
            <img src="/icons/info.svg" alt="name info" width="16" height="16px" /> <span className="info__text">Please upload a image in PNG or JPEG format with file size less than 4MB</span>
          </p>
          <div className="projectinfo__form__item">
            <TextField defaultValue={project.tagline} isMandatory={true} id="register-Project-tagline" label="Project Tagline*" name="tagline" type="text" placeholder="Enter Your Project Tagline" />
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

          {/* Projects */}

          <div className="msf__tr">
            <div className="msf__tr__head">
              <p className="msf__tr__head__item">Team*</p>
              <p className="msf__tr__head__item">Role*</p>
            </div>
            <div className="msf__tr__content">
              {projectLinks.map((projectLink: any, index: any) => (
                <div key={`teams-role-${index}`} className="msf__tr__content__cn">
                  <div className="msf__tr__content__cn__teams">
                    <TextField
                      id="register-project-link-text"
                      value={projectLink.text}
                      isMandatory={projectLink?.url ? true : false}
                      name={`projectLinks${index}-text`}
                      placeholder="Enter Your Project Link Text"
                      type="text"
                      onChange={(e) => onProjectLinkTextChange(index, e.target.value)}
                    />
                  </div>
                  <div className="msf__tr__content__cn__role">
                    <TextField
                      id="register-project-link-url"
                      value={projectLink.url}
                      isMandatory={projectLink?.text ? true : false}
                      name={`projectLinks${index}-url`}
                      placeholder="Enter your project link url"
                      onChange={(e) => onProjectLinkUrlChange(index, e.target.value)}
                      type="url"
                    />
                  </div>
                  <div className="msf__tr__content__cn__delete">
                    {index !== 0 && (
                      <button className="msf__tr__content__cn__delete__btn" onClick={() => onDeleteProjectLink(index)} type="button">
                        <Image src="/icons/close.svg" alt="delete team role" width="18" height="18" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {projectLinks.length && (
                <div className="msf__tr__add">
                  <div className="msf__tr__add__btn" onClick={onAddProjectLink}>
                    <Image src="/icons/add.svg" width="16" height="16" alt="Add New" />
                    <span>Add team and role</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Contact email */}
          <div className="projectinfo__form__item">
            <TextField defaultValue={project.contactEmail}  id="register-Project-email" label="Contact Email" name="contactEmail" type="email" placeholder="Enter Email Address" />
          </div>

          <div className="projectinfo__form__item">
            {/* <Toggle
          onChange={() => {}}
              value={project.lookingForFunding}
              disabled={false}
              name={`lookingForFunding`}
              id={`project-register-raising-funds`}
            /> */}
            <CustomToggle defaultChecked={project?.lookingForFunding} name={`lookingForFunding`} id={`project-register-raising-funds`} onChange={() => {}} />
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
