'use client';
import CustomToggle from '@/components/form/custom-toggle';
import { triggerLoader } from '@/utils/common.utils';
import Cookies from 'js-cookie';
import { useRouter } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { toast } from 'react-toastify';

function MemberPrivacyForm(props: any) {
  const uid = props?.uid;
  const preferences = props?.preferences ?? {};
  const settings = preferences?.preferenceSettings ?? {};
  const memberSettings = preferences?.memberPreferences ?? {};
  const isPreferenceEmpty = preferences?.isPreferenceAvailable
  const formRef = useRef<HTMLFormElement | null>(null);
  const actionRef = useRef<HTMLDivElement | null>(null);
  const router = useRouter();
  const preferenceFormItems = [
    {
      title: 'Contact details',
      items: [
        { name: 'email', title: 'Show Email', info: 'Enabling this will display your email to all logged in members' },
        { name: 'github', title: 'Show GitHub', info: 'Enabling this will display your GitHub handle to all logged in members' },
        { name: 'telegram', title: 'Show Telegram', info: 'Enabling this will display your Telegram handle to all logged in members' },
        { name: 'linkedin', title: 'Show LinkedIn Profile', info: 'Enabling this will display your LinkedIn Profile link to all logged in members' },
        { name: 'discord', title: 'Show Discord', info: 'Enabling this will display your Discord handle link to all logged in members' },
        { name: 'twitter', title: 'Show Twitter', info: 'Enabling this will display your Twitter Handle to all logged in members' },
      ],
    },
    { title: 'Profile', items: [{ name: 'githubProjects', title: 'Show my GitHub Projects', info: 'Control visibility of your GitHub projects' }] },
  ];

  const onFormChange = () => {
    let isFormChanged = false;
    if (formRef.current) {
      const keys = Object.keys(memberSettings);
      const formData = new FormData(formRef.current);
      const formValues = Object.fromEntries(formData);
      [...keys].forEach((key) => {
        const formValueForKey = formValues[key] === 'on' ? true : false;
        if (memberSettings[key] !== formValueForKey && settings[key] !== false) {
          isFormChanged = true;
        }
      });
    }
    return isFormChanged;
  };

  const onFormReset = () => {
   /*  if (actionRef.current) {
      actionRef.current.style.visibility = 'hidden';
    } */
  };

  const onFormSubmitted = async (e: any) => {
    try {
      triggerLoader(true);
      e.stopPropagation();
      e.preventDefault();
      if (formRef.current) {
        const formData = new FormData(formRef.current);
        const formValues = Object.fromEntries(formData);
        let payload = {
          ...settings,
        };
        if(typeof memberSettings.github === 'undefined') {
          payload.showGithub = true;
        } else {
          payload.showGithub = formValues.github === 'on' ? true : false;
        }

        if(typeof memberSettings.showEmail === 'undefined') {
          payload.showEmail = true;
        } else {
          payload.showEmail = formValues.email === 'on' ? true : false;
        }

        if(typeof memberSettings.showDiscord === 'undefined') {
          payload.showDiscord = true
        } else {
          payload.showDiscord = formValues.discord === 'on' ? true : false;
        }

        if(typeof memberSettings.showTwitter === 'undefined') {
          payload.showTwitter = true
        } else {
          payload.showTwitter = formValues.twitter === 'on' ? true : false;
        }

        if(typeof memberSettings.showLinkedin === 'undefined') {
          payload.showLinkedin = true
        } else {
          payload.showLinkedin = formValues.linkedin === 'on' ? true : false;
        }

        if(typeof memberSettings.showTelegram === 'undefined') {
          payload.showTelegram = true
        } else {
          payload.showTelegram = formValues.telegram === 'on' ? true : false;
        }

        if(typeof memberSettings.showGithubHandle === 'undefined') {
          payload.showGithubHandle = true
        } else {
          payload.showGithubHandle = formValues.github === 'on' ? true : false;
        }

        if(typeof memberSettings.showGithubProjects === 'undefined') {
          payload.showGithubProjects = true
        } else {
          payload.showGithubProjects = formValues.githubProjects === 'on' ? true : false;
        }
       
        console.log(payload, formValues, memberSettings)

        const authToken:any = Cookies.get('authToken');
        if(!authToken) {
          return;
        }
        const apiResult = await fetch(`${process.env.DIRECTORY_API_URL}/v1/member/${uid}/preferences`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${JSON.parse(authToken)}`,
          },
        });
        triggerLoader(false);
        if (apiResult.ok) {
         /*  if (actionRef.current) {
            actionRef.current.style.visibility = 'hidden';
          } */
          toast.success('Preferences updated successfully');
          router.refresh();
        } else {
          toast.success('Preferences update failed. Something went wrong. Please try again later');
        }
      }
    } catch (e) {
      triggerLoader(false);
      toast.success('Preferences update failed. Something went wrong. Please try again later');
    }
  };

  useEffect(() => {
    function handleNavigate(e: any) {
      const url = e.detail.url;
      let proceed = true;
      const isChanged = onFormChange();
      console.log(isChanged, e.detail);
      if(isChanged) {
        proceed = confirm('There are some unsaved changed. Do you want to proceed?')
      }
      if(!proceed) {
        return;
      }
      router.push(url);
    }
    document.addEventListener('settings-navigate', handleNavigate)
    return function() {
      document.removeEventListener('settings-navigate', handleNavigate)
    }
  }, [preferences])


  return (
    <>
      <form onSubmit={onFormSubmitted} onReset={onFormReset} ref={formRef} className="pf">
        {preferenceFormItems.map((prefForm: any, index: number) => (
          <div className="pf__cn" key={`pref-form-${index}`}>
            <h2 className="pf__title">{prefForm.title}</h2>
            <div className="pf__fields">
              {prefForm.items.map((pref: any) => (
                <div className={`pf__fields__item ${!settings[pref.name] ? 'pf__fields__item--disabled' : ''}`} key={`pref-${pref.name}`}>
                  <div>
                    <CustomToggle 
                    disabled={!settings[pref.name]} 
                    onChange={(value) => console.log(value)} 
                    name={pref.name} 
                    id={`privacy-${pref.name}`} 
                    defaultChecked={memberSettings[pref.name] ?? true} 
                  />
                 
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
        <div ref={actionRef} className="fa">
          <div className="fa__action">
            <button className="fa__action__cancel" type="reset">
              Reset
            </button>
            <button className="fa__action__save" type="submit">
              Save Changes
            </button>
          </div>
        </div>
      </form>
      <style jsx>
        {`
          .fa {
            position: sticky;
            border-top: 2px solid #ff820e;
            margin: 0;
            width: 100%;
            flex-direction: column;
            bottom: 0px;
            padding: 16px;
            left: auto;
            background: white;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .fa__info {
            display: flex;
            color: #64748b;
            font-size: 14px;
            font-weight: 500;
            align-items: center;
            gap: 6px;
          }

          .fa__action {
            display: flex;
            gap: 6px;
          }
          .fa__action__save {
            padding: 10px 24px;
            background: #156ff7;
            color: white;
            font-size: 14px;
            font-weight: 500;
            border-radius: 8px;
          }
          .fa__action__cancel {
            padding: 10px 24px;
            background: white;
            color: #0f172a;
            font-size: 14px;
            border: 1px solid #cbd5e1;
            font-weight: 500;
            border-radius: 8px;
          }

          .pf {
            width: 100%;
            padding: 16px;
          }
          .pf__cn {
            padding: 24px 20px;
            border: 1px solid #e2e8f0;
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
           
          }
          }
        `}
      </style>
    </>
  );
}

export default MemberPrivacyForm;
