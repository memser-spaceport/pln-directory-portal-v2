'use client';
import CustomToggle from '@/components/form/custom-toggle';
import { compareObjsIfSame, getAnalyticsUserInfo, triggerLoader } from '@/utils/common.utils';
import Cookies from 'js-cookie';
import { useRouter } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { toast } from 'react-toastify';
import SettingsAction from './actions';
import { useSettingsAnalytics } from '@/analytics/settings.analytics';
import { Tooltip } from '@/components/core/tooltip/tooltip';

function MemberPrivacyForm(props: any) {
  const uid = props?.uid;
  const preferences = props?.preferences ?? {};
  const userInfo = props?.userInfo;
  const settings = preferences?.preferenceSettings ?? {};
  const memberSettings = preferences?.memberPreferences ?? {};
  const formRef = useRef<HTMLFormElement | null>(null);
  const router = useRouter();
  const analytics = useSettingsAnalytics();
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

  const onFormChange = () => {
    if (!formRef.current) {
      return false;
    }
    const keys = Object.keys(preferences.preferenceSettings );
    const formData = new FormData(formRef.current);
    const formValues = Object.fromEntries(formData);
    let formattedFormValues: any = {};
    let formattedMemberSettings: any = {};
    [...keys].forEach((key) => {
      formattedMemberSettings[key] = memberSettings[key] ?? true;
      formattedFormValues[key] = formValues[key] === 'on' ? true : false;
    });
    const isBothSame = compareObjsIfSame(formattedMemberSettings, formattedFormValues);
    return isBothSame;
  };

  const onFormReset = (e: any) => {
    const isBothSame = onFormChange();
    if (isBothSame) {
      toast.info('There are no changes to reset');
      return;
    }
    analytics.recordMemberPreferenceReset(getAnalyticsUserInfo(userInfo));
    const proceed = confirm('Do you want to reset the changes ?');
    if (!proceed) {
      e.preventDefault();
      return;
    }
  };

  const onFormSubmitted = async (e: any) => {
    try {
      e.stopPropagation();
      e.preventDefault();
      if (!formRef.current) {
        return;
      }
      const isBothSame = onFormChange();
      if (isBothSame) {
        toast.info('There are no changes to save');
        return;
      }
      analytics.recordMemberPreferenceChange('save-click', getAnalyticsUserInfo(userInfo));
      triggerLoader(true);

      const formData = new FormData(formRef.current);
      const formValues = Object.fromEntries(formData);
      let payload = {
        ...settings,
      };
      payload.showGithub = formValues.github === 'on' ? true : false;
      payload.showEmail = formValues.email === 'on' ? true : false;
      payload.showDiscord = formValues.discord === 'on' ? true : false;
      payload.showTwitter = formValues.twitter === 'on' ? true : false;
      payload.showLinkedin = formValues.linkedin === 'on' ? true : false;
      payload.showTelegram = formValues.telegram === 'on' ? true : false;
      const isSubscribedToNewsletter = formValues.newsLetter === 'on' ? true : false;

      payload.showGithubHandle = formValues.github === 'on' ? true : false;
      payload.showGithubProjects = formValues.githubProjects === 'on' ? true : false;

      // delete unused fields
      delete payload.githubHandle;
      delete payload.newsLetter;
     

      const authToken: any = Cookies.get('authToken');
      if (!authToken) {
        analytics.recordMemberPreferenceChange('error', getAnalyticsUserInfo(userInfo), payload);
        return;
      }
      const apiResult = await fetch(`${process.env.DIRECTORY_API_URL}/v1/member/${uid}/preferences`, {
        method: 'PATCH',
        cache: 'no-store',
        body: JSON.stringify(payload),
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${JSON.parse(authToken)}`,
        },
      });

      const memberUpdateResult = await fetch(`${process.env.DIRECTORY_API_URL}/v1/members/${uid}`, {
        method: 'PATCH',
        body: JSON.stringify({
          isSubscribedToNewsletter: isSubscribedToNewsletter
        }),
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${JSON.parse(authToken)}`,
        },
      })

      triggerLoader(false);
      if (apiResult.ok || memberUpdateResult.ok) {
        /*  if (actionRef.current) {
            actionRef.current.style.visibility = 'hidden';
          } */
        toast.success('Preferences updated successfully');
        analytics.recordMemberPreferenceChange('success', getAnalyticsUserInfo(userInfo), payload);
        router.refresh();
      } else {
        toast.success('Preferences update failed. Something went wrong. Please try again later');
        analytics.recordMemberPreferenceChange('error', getAnalyticsUserInfo(userInfo), payload);
      }
    } catch (e) {
      triggerLoader(false);
      toast.success('Preferences update failed. Something went wrong. Please try again later');
      analytics.recordMemberPreferenceChange('success', getAnalyticsUserInfo(userInfo));
    }
  };

  const onItemChange = (e: any) => {
    const currentValue = !e.target.checked;
    const itemName = e.target.name;
    if (itemName === 'github' && currentValue === true) {
      const proceed = confirm('Hiding GitHub handle will automatically disable visibility of your projects. Do you wish to proceed?');
      if (!proceed) {
        e.target.checked = !e.target.checked;
      } else {
        const elem = document.getElementById('privacy-githubProjects') as HTMLInputElement | null;
        if (elem !== null) {
          elem.checked = false;
        }
      }
    } else if (itemName === 'githubProjects' && currentValue === false) {
      const elem = document.getElementById('privacy-github') as HTMLInputElement | null;
      if (elem !== null && elem.checked === false) {
        e.target.checked = !e.target.checked;
      }
    }
  };

  useEffect(() => {
    triggerLoader(false)
    function handleNavigate(e: any) {
      const url = e.detail.url;
      let proceed = true;
      const isBothSame = onFormChange();
      if (!isBothSame) {
        proceed = confirm('There are some unsaved changed. Do you want to proceed?');
      }
      if (!proceed) {
        return;
      }
      triggerLoader(true)
      router.push(url);
      router.refresh();
    }
    document.addEventListener('settings-navigate', handleNavigate);
    return function () {
      document.removeEventListener('settings-navigate', handleNavigate);
    };
  }, [preferences]);

  return (
    <>
      <form onSubmit={onFormSubmitted} onReset={onFormReset} ref={formRef} className="pf">
        {preferenceFormItems.map((prefForm: any, index: number) => (
          <div className="pf__cn" key={`pref-form-${index}`}>
            <h2 className="pf__title">
              <span>{prefForm.title}</span>
              {index === 0 && <span><Tooltip asChild trigger={<img className='pf__title__img' src='/icons/info.svg'/>} content="Privacy settings only enabled for available contact details."/></span>}
            </h2>
            <div className="pf__fields">
              {prefForm.items.map((pref: any) => (
                <div className={`pf__fields__item ${!settings[pref.name] ? 'pf__fields__item--disabled' : ''}`} key={`pref-${pref.name}`}>
                  <div>
                    <CustomToggle disabled={!settings[pref.name]} onChange={onItemChange} name={pref.name} id={`privacy-${pref.name}`} defaultChecked={memberSettings[pref.name] ?? true} />
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
        <SettingsAction />
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
          }
          .pf__cn {
            padding: 24px 20px;

            margin-bottom: 16px;
         
            border-top: 1px solid #cbd5e1;
          }
          .pf__title {
            font-size: 16px;
            font-weight: 700;
            color: #0f172a;
            display: flex;
            align-items: flex-start;
            gap: 4px;
          }
            .pf__title__img {margin-top: 1px;}
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
              border: 1px solid #e2e8f0;
            }
          }
        `}
      </style>
    </>
  );
}

export default MemberPrivacyForm;
