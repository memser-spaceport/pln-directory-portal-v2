'use client';
import Toggle from '@/components/form/toggle';

function MemberPrivacyForm() {
  const contractPrefernces = [
    { name: 'email', title: 'Show Email', info: 'Enabling this will display your email to all logged in members' },
    { name: 'github', title: 'Show GitHub', info: 'Enabling this will display your GitHub handle to all logged in members' },
    { name: 'telegram', title: 'Show Telegram', info: 'Enabling this will display your Telegram handle to all logged in members' },
    { name: 'linkedin', title: 'Show LinkedIn Profile', info: 'Enabling this will display your LinkedIn Profile link to all logged in members' },
    { name: 'discord', title: 'Show Discord', info: 'Enabling this will display your Discord handle link to all logged in members' },
    { name: 'twitter', title: 'Show Twitter', info: 'Enabling this will display your Twitter Handle to all logged in members' },
  ];
  return (
    <>
      <form className="pf">
        <h2 className="pf__title">Contact details</h2>
        <div className="pf__fields">
          {contractPrefernces.map((pref) => (
            <div className="pf__fields__item" key={`pref-${pref.name}`}>
              <Toggle id={`privacy-${pref.name}`} name="email" />
              <div className="pf__field__item__cn">
                <label className="pf__field__item__cn__label">{pref.title}</label>
                <div className="pf__field__item__cn__info">{pref.info}</div>
              </div>
            </div>
          ))}
        </div>

        <h2>Profile</h2>
      </form>
      <style jsx>
        {`
          .pf {
            width: 656px;
            padding: 24px 20px;
          }
          .pf__title {
            font-size: 16px;
            font-weight: 700;
            color: #0f172a;
          }
            .pf__fields {
              padding: 18px 0;
            }
          .pf__fields__item {
            padding: 12px 0;
            display: flex;
            gap: 24px;
          }
          .pf__field__item__cn__label {
            font-size: 14px;
            font-weight: 500;
            color: #0f172a;
            line-height: 20px;
          }
          .pf__field__item__cn__info {
            font-size: 13px;
            font-weight: 500;
            color: #0f172a;
            opacity: 0.6;
            line-height: 18px;
          }
        `}
      </style>
    </>
  );
}

export default MemberPrivacyForm;
