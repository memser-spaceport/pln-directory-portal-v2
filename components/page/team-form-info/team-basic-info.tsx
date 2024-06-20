import TextArea from '@/components/form/text-area';
import TextField from '@/components/form/text-field';

interface ITeamBasicInfo {
  errors: { key: string; message: string }[];
}

function TeamBasicInfo(props: ITeamBasicInfo) {
  const errors = props?.errors;
  return (
    <>
      <div className="teaminfo__form">
        <ul className="teaminfo__form__errs">
          {errors.map((error: { key: string; message: string }, index: number) => {
            return (
              <li className="teaminfo__form__errs__err" key={`${error.key}-${index}`}>
                {error?.message}
              </li>
            );
          })}
        </ul>
        <div className="teaminfo__form__item">
          <TextField isMandatory={true} id="register-team-requestor-email" label="Requestor Email*" name="requestorEmail" type="email" placeholder="Enter your email address" />
        </div>
        <div className="teaminfo__form__user">
          <div className="teaminfo__form__user__profile">
            <img width="32" height="32" alt="upload member image" src="/icons/camera.svg" />
            <p className="teaminfo__form__user__profile__text">Add Image</p>
            <input hidden type="file" accept="image/png, image/jpeg" />
          </div>
          <div className="teaminfo__form__item">
            <TextField maxLength={150} isMandatory id="register-team-name" label="What is your organization, company, or team name?*" name="name" type="text" placeholder="Enter name here" />
          </div>
        </div>
        <p className="info">
          <img src="/icons/info.svg" alt="name info" width="16" height="16px" /> <span className="info__text">Please upload a squared image in PNG or JPEG format with file size less than 4MB.</span>
        </p>
        <div className="teaminfo__form__item">
          <TextArea
            maxLength={1000}
            isMandatory
            id="register-team-shortDescription"
            name="shortDescription"
            label="Briefly describe what your team/product/project does*"
            placeholder="Enter your short elevator pitch here"
          />
        </div>
        <p className="info">
          <img src="/icons/info.svg" alt="name info" width="16" height="16px" /> <span className="info__text">One to two sentences is perfect! Use clear language and minimal jargon.</span>
        </p>
        <div className="teaminfo__form__item">
          <TextArea maxLength={2000} isMandatory id="register-member-longDescription" name="longDescription" label="Long Description*" placeholder="Elaborate on your elevator pitch here" />
        </div>
        <p className="info">
          <img src="/icons/info.svg" alt="name info" width="16" height="16px" />{' '}
          <span className="info__text">Please explain what your team does in a bit more detail. 4-5 sentences will be great!.</span>
        </p>
        <div className="teaminfo__form__item">
          <TextField isMandatory={false} id="register-team-officeHours" label="Team Office Hours" name="officeHours" type="text" placeholder="Enter link here" />
        </div>
        <p className="info">
          <img src="/icons/info.svg" alt="name info" width="16" height="16px" />{' '}
          <span className="info__text">If your team offers group office hours or open meetings that are open to the public, please share the link so PLN members can join and learn more.</span>
        </p>
      </div>
      <style jsx>
        {`
          .info {
            display: flex;
            gap: 4px;
            align-items: center;
            margin: 14px 0;
          }
          .info__text {
            text-align: left;
            font-size: 13px;
            opacity: 40%;
            color: #0f172a;
            font-weight: 500;
            line-height: 18px;
          }
          .teaminfo__form {
            display: flex;
            flex-direction: column;
          }
          .teaminfo__form__item {
            margin: 10px 0;
            flex: 1;
          }
          .teaminfo__form__user {
            display: flex;
            gap: 20px;
            width: 100%;
          }
          .teaminfo__form__user__profile {
            width: 100px;
            height: 100px;
            border: 3px solid #cbd5e1;
            background: #f1f5f9;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            border-radius: 50px;
            color: #156ff7;
            font-size: 12px;
          }

          .teaminfo__form__errs {
            display: grid;
            gap: 4px;
            padding-left: 16px;
          }

          .teaminfo__form__errs__err {
            color: #ef4444;
            font-size: 12px;
            line-height: 16px;
          }
        `}
      </style>
    </>
  );
}

export default TeamBasicInfo;
