import TextField from '@/components/form/text-field';

function MemberBasicInfo() {
  return (
    <>
      <div className="memberinfo__form">
        <div className="memberinfo__form__user">
          <div className="memberinfo__form__user__profile">
            <img width="32" height="32" alt='upload member image' src='/icons/camera.svg'/>
            <p className='memberinfo__form__user__profile__text'>Add Image</p>
            <input hidden type='file' accept='image/png, image/jpeg'/>
          </div>
          <div className="memberinfo__form__item">
            <TextField isMandatory={true} id="register-member-name" label="Name*" name="name" type="text" placeholder="Enter your full name" />
          </div>
        </div>
        <p className="info">
          <img src="/icons/info.svg" alt="name info" width="16" height="16px" /> <span className="info__text">Please upload a image in PNG or JPEG format with file size less than 4MB</span>
        </p>
        <div className="memberinfo__form__item">
          <TextField isMandatory={true} id="register-member-email" label="Email*" name="email" type="email" placeholder="Enter your email address" />
        </div>
        <div className="memberinfo__form__item">
          <TextField id="register-member-startDate" label="Join Date" name="joindate" type="date" placeholder="Enter Start Date" />
        </div>
        <div className="memberinfo__form__item">
          <TextField id="register-member-city" label="City" name="city" type="text" placeholder="Enter your city" />
        </div>
        <p className="info">
          <img src="/icons/info.svg" alt="name info" width="16" height="16px" />{' '}
          <span className="info__text">Please share location details to receive invitations for the network events happening in your area.</span>
        </p>
        <div className="memberinfo__form__item">
          <TextField id="register-member-state" label="State" name="state" type="text" placeholder="Enter your state" />
        </div>
        <div className="memberinfo__form__item">
          <TextField id="register-member-country" label="Country" name="country" type="text" placeholder="Enter your country" />
        </div>
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
            color: grey;
          }
          .memberinfo__form {
            display: flex;
            flex-direction: column;
          }
          .memberinfo__form__item {
            margin: 10px 0;
            flex: 1;
          }
          .memberinfo__form__user {
            display: flex;
            gap: 20px;
            width: 100%;
          }
          .memberinfo__form__user__profile {
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
         
          
        `}
      </style>
    </>
  );
}

export default MemberBasicInfo;
