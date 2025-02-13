import CustomToggle from '@/components/form/custom-toggle';
import TextArea from '@/components/form/text-area';
import TextField from '@/components/form/text-field';
import TextEditor from '@/components/ui/text-editor';
import { IProjectLinks, IProjectResponse } from '@/types/project.types';
import Image from 'next/image';
import { useRef, useState } from 'react';

interface ProjectBasicInfoProps {
  errors: string[];
  project: IProjectResponse;
  longDesc: string;
  setLongDesc: (content: string) => void;
}

function ProjectGeneralInfo(props: ProjectBasicInfoProps) {
  const errors = props.errors;
  const project = props.project;
  const uploadImageRef = useRef<HTMLInputElement>(null);
  const [profileImage, setProfileImage] = useState<string>(project?.logo);

  const links = project?.projectLinks?.length > 0 ? project?.projectLinks : [{ text: '', url: '' }];

  const [projectLinks, setProjectLinks] = useState<any>(links);

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
      old[index].name = value;
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

  return (
    <>
      <div className="projectinfo">
        {errors.length > 0 && (
          <ul className="projectinfo__errors">
            {errors.map((error: string, index: number) => (
              <li key={`project-error-${index}`}>{error}</li>
            ))}
          </ul>
        )}

        <div className="projectinfo__form">
          <div className="projectinfo__form__user">
            <div>
              <label htmlFor="Project-image-upload" className="projectinfo__form__user__profile">
                {!profileImage && <img width="24" height="24" alt="project-logo" src="/icons/add-logo.svg" />}
                {!profileImage && <span className="projectinfo__form__user__profile__text">Add project logo</span>}
                {profileImage && <img className="projectinfo__form__user__profile__preview" src={profileImage} alt="user profile" width="95" height="95" />}
                {profileImage && (
                  <span className="projectinfo__form__user__profile__actions">
                    <img width="32" height="32" title="Change profile image" alt="change image" src="/icons/recycle.svg" />
                    <img onPointerDown={onDeleteImage} width="32" height="32" title="Delete profile image" alt="delete image" src="/icons/trash.svg" />
                  </span>
                )}
              </label>
              <input readOnly id="team-info-basic-image" value={profileImage} hidden name="imageFile"  />
              <input onChange={onImageUpload} id="Project-image-upload" name="projectProfile" ref={uploadImageRef} hidden type="file" accept="image/png, image/jpeg" />

              <p className="profileInfo__mob">
                <img src="/icons/info.svg" alt="name info" width="16" height="16px" />{' '}
                <span className="profileInfo__mob__text">Please upload a image in PNG or JPEG format with file size less than 4MB</span>
              </p>
            </div>

            {/* Name */}
            <div className="projectinfo__form__item">
              <TextField maxLength={64} isMandatory={true} id="add-project-name" label="Project Name*" defaultValue={project.name} name="name" type="text" placeholder="Enter Project Name Here" />
            </div>
          </div>

          {/* INFO */}
          <p className="profileInfo__web">
            <img src="/icons/info.svg" alt="name info" width="16" height="16px" />{' '}
            <span className="profileInfo__web__text">Please upload a image in PNG or JPEG format with file size less than 4MB</span>
          </p>

          {/* Tag line */}
          <div className="projectinfo__form__item__tabLine">
            <TextField
              maxLength={100}
              defaultValue={project.tagline}
              isMandatory={true}
              id="register-Project-tagline"
              label="Project Tagline*"
              name="tagline"
              type="text"
              placeholder="Enter Your Project Tagline"
            />
          </div>

          {
            <label className={`tf__label`}>
              Long Description*
            </label>
          }
          <div className="projectinfo__form__item__description">
          <TextEditor text={props?.longDesc} setContent={props.setLongDesc} id='register-project-longDescription'/>
            {/* <TextArea
              defaultValue={project.description}
              maxLength={1000}
              isMandatory
              id="register-project-shortDescription"
              name="description"
              label="Detailed Description Of Your Project*"
              placeholder="Enter Detailed Description Of Your Project"
            /> */}
          </div>

          {/* Projects */}

          <div className="msf__tr">
            <div className="msf__tr__links">
              {projectLinks?.map((projectLink: IProjectLinks, index: number) => (
                <div key={`teams-role-${index}`} className="msf__tr__links__link">
                  <div className="msf__tr__links__link__header">
                    <div>PROJECT {index + 1}</div>
                    <div className="msf__tr__links__link__cn__delete">
                      {index !== 0 && (
                        <button className="msf__tr__links__link__cn__delete__btn" onClick={() => onDeleteProjectLink(index)} type="button">
                          <Image src="/icons/delete-brown.svg" alt="delete team role" width="12" height="12" />
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="msf__tr__links__link__cn">
                    <div className="msf__tr__links__link__cn__linkText">
                      <div>Project Link Text</div>
                      <TextField
                        maxLength={74}
                        id="register-project-link-text"
                        defaultValue={projectLink.name}
                        isMandatory={projectLink?.url ? true : false}
                        name={`projectLinks${index}-name`}
                        placeholder="Enter Link Text"
                        type="text"
                        onChange={(e) => onProjectLinkTextChange(index, e.target.value)}
                      />
                    </div>
                    <div className="msf__tr__links__link__cn__link">
                      <div>Project Link</div>
                      <TextField
                        maxLength={74}
                        id="register-project-link-url"
                        defaultValue={projectLink.url}
                        isMandatory={projectLink?.name ? true : false}
                        name={`projectLinks${index}-url`}
                        placeholder="Enter Link"
                        onChange={(e) => onProjectLinkUrlChange(index, e.target.value)}
                        type="url"
                      />
                    </div>
                  </div>
                </div>
              ))}
              {projectLinks.length < 3 && (
                <div className="msf__tr__add">
                  <div className="msf__tr__add__btn" onClick={onAddProjectLink}>
                    <Image src="/icons/add.svg" width="16" height="16" alt="Add New" />
                    <div className="msf__tr__add__btn__addText">Add project URL </div> <div className="msf__tr__add__btn__maxText">(max 3)</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Contact email */}
          <div className="projectinfo__form__item__contactEmail">
            <TextField defaultValue={project.contactEmail} id="register-Project-email" label="Contact Email" name="contactEmail" type="email" placeholder="Enter Email Address" />
          </div>

          <div className="projectinfo__form__item__lookingf">
            <CustomToggle defaultChecked={project?.lookingForFunding} name={`lookingForFunding`} id={`project-register-raising-funds`} onChange={() => {}} />
            <div className="projectinfo__form__item__lookingf__qus">Are you currently looking to raise funds for your project?</div>

            {/* Funding info */}
          </div>
          <p className="functiongInfo">
            <img src="/icons/info.svg" alt="name info" width="16" height="16px" />{' '}
            <span className="fundingInfo__text">Enabling this implies you are raising funds to support your project. You will be approached by investors who are interested in your project</span>
          </p>
          <div></div>
        </div>
      </div>
      <style jsx>
        {`
        .tf__label {
            font-weight: 600;
            font-size: 14px;
            margin-top: 20px;
          }
          .profileInfo__web {
            display: none;
          }

          .profileInfo__mob {
            display: flex;
            gap: 4px;
            align-items: center;
            margin-top: 10px;
            padding-bottom: 10px;
            border-bottom: 1px solid #f1f5f9;
          }
          .profileInfo__mob__text {
            text-align: left;
            font-size: 13px;
            opacity: 0.4;
          }

          .projectinfo__form__item__description {
            textarea {
              height: 80px;
            }
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
            flex: 1;
          }

          .projectinfo__form__item__tabLine {
            flex: 1;
            margin-top: 28px;
          }

          .projectinfo__form__item__description {
            flex: 1;
            margin-top: 28px;
          }

          .projectinfo__form__item__cn {
            display: flex;
            gap: 10px;
            width: 100%;
          }

          .projectinfo__form__user {
            display: flex;
            gap: 18px;
            justify-content: center;
            width: 100%;
            flex-direction: column;
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
            color: #156ff7;
            font-size: 12px;
            cursor: pointer;
            position: relative;
            border-radius: 8px;
            margin: auto;
          }

          .projectinfo__form__user__profile__text {
            font-size: 13px;
            margin-top: 4px;
            font-weight: 600;
            line-height: 18px;
            text-align: center;
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
            border-radius: 5px;
            background: rgb(0, 0, 0, 0.4);
          }

          .projectinfo__form__user__profile__preview {
            object-fit: cover;
            object-position: top;
            border-radius: 8px;
          }

          .msf__tr__links__link__header {
            display: flex;
            font-size: 12px;
            font-weight: 700;
            line-height: 20px;
            color: #64748b;
            justify-content: space-between;
          }

          .msf__tr__links__link {
            display: flex;
            flex-direction: column;
            gap: 10px;
            margin-top: 28px;
          }

          .msf__tr__links__link__cn {
            display: flex;
            flex-direction: column;
            gap: 10px;
          }

          .projectinfo__form__item__contactEmail {
            margin-top: 28px;
          }

          .msf__tr__links__link__cn__linkText {
            display: flex;
            flex-direction: column;
            gap: 12px;
            font-size: 14px;
            line-height: 20px;
            font-weight: 600;
          }

          .msf__tr__links__link__cn__link {
            display: flex;
            flex-direction: column;
            gap: 12px;
            font-size: 14px;
            line-height: 20px;
            font-weight: 600;
          }

          .msf__tr__links__link__cn__delete__btn {
            height: 24px;
            width: 24px;
            background-color: #dd2c5a1a;
            outline: none;
            border: none;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 50%;
          }

          .msf__tr__add__btn__addText {
            font-size: 14px;
            color: #156ff7;
            font-weight: 500;
          }

          .msf__tr__add {
            margin-top: 10px;
          }

          .msf__tr__add__btn {
            display: flex;
            align-items: center;
            gap: 4px;
            cursor: pointer;
          }

          .msf__tr__add__btn__maxText {
            font-size: 14px;
            font-weight: 500;
            line-height: 24px;
            color: #94a3b8;
          }

          .projectinfo__form__item__lookingf {
            display: flex;
            align-items: center;
            gap: 9px;
            margin-top: 28px;
          }

          .projectinfo__form__item__lookingf__qus {
            font-size: 14px;
            font-weight: 600;
            line-height: 20px;
            max-width: 80%;
          }

          .functiongInfo {
            display: flex;
            gap: 6px;
            margin-top: 20px;
            align-items: start;
            font-size: 13px;
            line-height: 18px;
            font-weight: 500;
            opacity: 0.4;
            color: #0f172a;
          }

          @media (min-width: 1024px) {
            .projectinfo__form__user {
              flex-direction: row;
              gap: 20px;
            }

            .projectinfo__form__item__description {
              textarea {
                height: 200px;
              }
            }

            .profileInfo__mob {
              display: none;
            }

            .profileInfo__web {
              display: flex;
              gap: 4px;
              align-items: center;
              margin-top: 12px;
            }
            .profileInfo__web__text {
              text-align: left;
              font-size: 13px;
              opacity: 0.4;
            }

            .projectinfo__form__item__tabLine {
              margin-top: 20px;
            }

            .projectinfo__form__item__description {
              margin-top: 20px;
            }

            .msf__tr__links__link {
              margin-top: 20px;
            }

            . .projectinfo__form__item__contactEmail {
              margin-top: 20px;
            }

            .msf__tr__links__link__cn {
              flex-direction: row;
              gap: 10px;
            }

            .msf__tr__links__link__cn__linkText {
              width: 50%;
            }

            .msf__tr__links__link__cn__link {
              width: 50%;
            }

            .projectinfo__form__item__contactEmail {
              margin-top: 20px;
            }

            .projectinfo__form__item__lookingf {
              dispaly: flex;
              gap: 9px;
              align-items: center;
              margin-top: 20px;
            }
          }
        `}
      </style>
    </>
  );
}

export default ProjectGeneralInfo;
