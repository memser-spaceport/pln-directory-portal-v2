import TextArea from '@/components/form/text-area';
import TextField from '@/components/form/text-field';

function MemberSocialInfo(props:any) {
  // const errors = props.errors ?? [];
  const initialValues = props.initialValues;
  return (
    <>
      <div className="memberinfo__form">
        <div className="memberinfo__form__item">
          <TextField type="text" id="register-member-linkedin" defaultValue={initialValues.linkedinHandler} name="linkedinHandler" label="LinkedIn" placeholder="eg.,https://linkedin.com/in/jbenetcs" />
        </div>
        <div className="memberinfo__form__item">
          <TextField type="text" id="register-member-discord" defaultValue={initialValues.discordHandler} name="discordHandler" label="Discord" placeholder="eg.,name#1234" />
          <p className="info">
            <img src="/icons/info.svg" alt="name info" width="16" height="16px" />{' '}
            <span className="info__text">This will help us tag you with permissions to access the best Discord channels for you.</span>
          </p>
        </div>
        <div className="memberinfo__form__item">
          <TextField type="text" id="register-member-twitter"  defaultValue={initialValues.twitterHandler} name="twitterHandler" label="Twitter" placeholder="eg.,@protocollabs" />
        </div>
        <div className="memberinfo__form__item">
          <TextField type="text" id="register-member-github" defaultValue={initialValues.githubHandler} name="githubHandler" label="GitHub" placeholder="Enter github handle" />
        </div>
        <div className="memberinfo__form__item">
          <TextField type="text" id="register-member-telegram" defaultValue={initialValues.telegramHandler} name="telegramHandler" label="Telegram" placeholder="Telegram" />
        </div>
        <div className="memberinfo__form__item">
          <TextField type="text" id="register-member-officehours" defaultValue={initialValues.officeHours} name="officeHours" label="Office hours link" placeholder="Enter office hours" />
          <p className="info">
            <img src="/icons/info.svg" alt="name info" width="16" height="16px" />{' '}
            <span className="info__text">
              Drop your calendar link here so others can get in touch with you at a time that is convenient. We recommend 15-min meetings scheduled via Calendly or Google Calendar appointments.
            </span>
          </p>
        </div>
        <div className="memberinfo__form__item">
          <TextArea id="register-member-comments" defaultValue={initialValues.moreDetails} name="moreDetails" label="Did we miss something?" placeholder="Enter details here" />
          <p className="info">
            <img src="/icons/info.svg" alt="name info" width="16" height="16px" />{' '}
            <span className="info__text">Let us know what else you would like to share and wish others would share to make it easier to locate and contact each other!</span>
          </p>
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
          .memberinfo__form {
            display: flex;
            flex-direction: column;
          }
          .memberinfo__form__item {
            margin: 10px 0;
            flex: 1;
          }
        `}
      </style>
    </>
  );
}

export default MemberSocialInfo;
