'use client';
import ToggleReadonly from '@/components/form/toggle-readonly';

function MemberPrivacyReadOnly(props: any) {
  const preferences = props?.preferences ?? {};
  const settings = preferences?.preferenceSettings ?? {};
  const memberSettings = preferences?.memberPreferences ?? {};
  const preferenceFormItems = [
    {
      title: 'Contact details',
      items: [
        { name: 'email', title: 'Show Email', info: 'Enabling this will display your email to all logged in people' },
        { name: 'github', title: 'Show GitHub', info: 'Enabling this will display your GitHub handle to all logged in people' },
        { name: 'telegram', title: 'Show Telegram', info: 'Enabling this will display your Telegram handle to all logged in people' },
        { name: 'linkedin', title: 'Show LinkedIn Profile', info: 'Enabling this will display your LinkedIn Profile link to all logged in people' },
        { name: 'discord', title: 'Show Discord', info: 'Enabling this will display your Discord handle link to all logged in people' },
        { name: 'twitter', title: 'Show Twitter', info: 'Enabling this will display your Twitter Handle to all logged in people' },
      ],
    },
    { title: 'Profile', items: [{ name: 'githubProjects', title: 'Show my GitHub Projects', info: 'Control visibility of your GitHub projects' }] },
    { title: 'Newsletter', items: [{ name: 'newsLetter', title: 'Subscribe to PL Newsletter', info: 'Get new letter straight to your inbox' }] },
  ];

  
  return (
    <>
      <div  className="pf">
        {preferenceFormItems.map((prefForm: any, index: number) => (
          <div className="pf__cn" key={`pref-form-${index}`}>
            <h2 className="pf__title">{prefForm.title}</h2>
            <div className="pf__fields">
              {prefForm.items.map((pref: any) => (
                <div className={`pf__fields__item ${!settings[pref.name] ? 'pf__fields__item--disabled' : ''}`} key={`pref-${pref.name}`}>
                  <div className='hide'>
                    <ToggleReadonly checked={memberSettings[pref.name] ?? true} />
                  </div>
                  <div className="pf__field__item__cn">
                    <label className="pf__field__item__cn__label">{pref.title}</label>
                    <div className="pf__field__item__cn__info">{pref.info}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <style jsx>
        {`
         .hide {
          pointer-events: none;
          cursor: none;
         }
          
          .pf {
            width: 100%;
           
          }
          .pf__cn {
            padding: 24px 20px;
          
            margin-bottom: 16px;
            border-radius: 8px;
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
            align-items: flex-start;
            opacity: 0.7;
            pointer-events: none;
          }
          .pf__field__item__cn {
            margin-top: -4px;
          }
          .pf__field__item__cn__label {
            font-size: 14px;
            font-weight: 500;
            color: #0f172a;
            line-height: 20px;
          }
          .pf__fields__item--disabled {
            opacity: 0.4;
          }
          .pf__field__item__cn__info {
            font-size: 13px;
            font-weight: 500;
            color: #0f172a;
            opacity: 0.6;
            line-height: 18px;
          }

          @media (min-width: 1024px) {
            .fa {
              height: 68px;
              flex-direction: row;
              left: auto;
              justify-content: center;
              align-items: center;
            }
            .pf {
              width: 656px;
              border: 1px solid #e2e8f0;
            }
          }
        `}
      </style>
    </>
  );
}

export default MemberPrivacyReadOnly;
