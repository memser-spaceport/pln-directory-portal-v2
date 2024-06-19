import TextArea from "@/components/form/text-area"
import TextField from "@/components/form/text-field"

function MemberSocialInfo() {
    return <>
     <div className="memberinfo__form">
        <div className="memberinfo__form__item">
          <TextField type="text" id="register-member-linkedin" name="linkedinHandler" label="LinkedIn" placeholder="eg.,https://linkedin.com/in/jbenetcs"/>
        </div>
        <div className="memberinfo__form__item">
          <TextField type="text" id="register-member-discord" name="discordHandler" label="Discord" placeholder="eg.,name#1234"/>
        </div>
        <div className="memberinfo__form__item">
          <TextField type="text" id="register-member-twitter" name="twitterHandler" label="Twitter" placeholder="eg.,@protocollabs"/>
        </div>
        <div className="memberinfo__form__item">
          <TextField type="text" id="register-member-github" name="githubHandler" label="Github" placeholder="Enter Github handle"/>
        </div>
        <div className="memberinfo__form__item">
          <TextField type="text" id="register-member-telegram" name="telegramHandler" label="Telegram" placeholder="Telegram"/>
        </div>
        <div className="memberinfo__form__item">
          <TextField type="text" id="register-member-officehours" name="officeHours" label="Office hours link" placeholder="enter office hours"/>
        </div>
        <div className="memberinfo__form__item">
          <TextArea id="register-member-comments" name="comments" label="Did we miss something?" placeholder="Enter details here"/>
        </div>
      </div>
      <style jsx>
        {`
          .info {display: flex; gap: 4px; align-items: center; margin: 14px 0;}
          .info__text {text-align: left; font-size: 13px; color: grey;}
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
}

export default MemberSocialInfo