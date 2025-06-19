'use client'
import TextField from '@/components/form/text-field';
import URLTextField from '@/components/form/url-text-field';

interface ITeamSocialInfo {
  errors: string[];
  initialValues?: any;
}

function TeamSocialInfo(props: ITeamSocialInfo) {
  const errors = props?.errors;
  const initialValues = props?.initialValues

  return (
    <>
      <div className="teamSocialInfo__form">
        {errors.length > 0 && (
          <ul className="teamSocialInfo__form__errs">
            {errors.map((error: string, index: number) => {
              return (
                <li className="teamSocialInfo__form__errs__err" key={`team-err-${index}`}>
                  {error}
                </li>
              );
            })}
          </ul>
        )}
        <div className="teamSocialInfo__form__item">
          <URLTextField isMandatory defaultValue={initialValues?.contactMethod ?? ''} maxLength={200} id="register-team-contactMethod" label="Preferred method of contact*" name="contactMethod" type="text" placeholder="Enter contact method" urlType="contactMethod" />
          <p className="info">
            <img src="/icons/info.svg" alt="name info" width="16" height="16px" />{' '}
            <span className="info__text">What is the best way for people to connect with your team? (e.g., team Slack channel, team email address, team Discord server/channel, etc.)</span>
          </p>
        </div>
        <div className="teamSocialInfo__form__item">
          <URLTextField isMandatory maxLength={1000} id="register-team-website" label="Website address*" defaultValue={initialValues?.website ?? ''} name="website" type="text" placeholder="Enter address here" urlType="website" />
          <p className="info">
            <img src="/icons/info.svg" alt="name info" width="16" height="16px" />{' '}
            <span className="info__text">Let us check out what you and your team do! If you have more than one primary website (i.e a docs site), list one per line.</span>
          </p>
        </div>
        <URLTextField id="register-team-linkedinHandler" maxLength={200} label="LinkedIn" defaultValue={initialValues?.linkedinHandler ?? ''} name="linkedinHandler" type="text" placeholder="eg., https://www.linkedin.com/in/jbenetcs/" urlType="linkedin" />
        <URLTextField id="register-team-twitterHandler" maxLength={200} label="Twitter" defaultValue={initialValues?.twitterHandler ?? ''} name="twitterHandler" type="text" placeholder="e.g., @protocollabs" urlType="twitter" />
        <URLTextField id="register-team-telegramHandler" maxLength={200} label="Telegram" defaultValue={initialValues?.telegramHandler ?? ''} name="telegramHandler" type="text" placeholder="Telegram" urlType="telegram" />
        <div className="teamSocialInfo__form__item">
          <URLTextField id="register-team-blog" maxLength={1000} label="Blog address" defaultValue={initialValues?.blog ?? ''} name="blog" type="text" placeholder="Enter address here" urlType="blog" />
          <p className="info">
            <img src="/icons/info.svg" alt="name info" width="16" height="16px" />{' '}
            <span className="info__text">Sharing your blog link allows us to stay up to date with you, your team, and the direction you are going!</span>
          </p>
        </div>
      </div>
      <style jsx>
        {`
          .teamSocialInfo__form {
            display: flex;
            flex-direction: column;
            gap: 20px;
            padding: 20px 24px;
          }
          .teamSocialInfo__form__item {
            display: flex;
            flex-direction: column;
            gap: 12px;
            width: 100%;
          }
          .teamSocialInfo__form__team {
            display: flex;
            gap: 20px;
            width: 100%;
          }
          .teamSocialInfo__form__errs {
            display: grid;
            gap: 4px;
            padding-left: 16px;
          }
          .teamSocialInfo__form__errs__err {
            color: #ef4444;
            font-size: 12px;
            line-height: 16px;
          }
          .info {
            display: flex;
            gap: 4px;
            align-items: center;
          }
          .info__text {
            text-align: left;
            font-size: 13px;
            opacity: 40%;
            color: #0f172a;
            font-weight: 500;
            line-height: 18px;
          }
        `}
      </style>
    </>
  );
}

export default TeamSocialInfo;
