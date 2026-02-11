import React, { useState, useRef, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { toast } from '@/components/core/ToastContainer';
import { IUserInfo } from '@/types/shared.types';
import { getDefaultAvatar } from '@/hooks/useDefaultAvatar';
import { useIrlAnalytics } from '@/analytics/irl.analytics';
import { getProfileFromURL } from '@/utils/common.utils';
import { ProfileSocialLink } from '@/components/page/member-details/profile-social-link';
import { getMember } from '@/services/members.service';
import PageLoader from '@/components/core/page-loader';
import MultiSelect from '@/components/form/MultiSelect';
import { useGetTeamsFormOptions } from '@/hooks/createTeam/useGetTeamsFormOptions';
import { submitSpeakerRequest } from '@/services/irl.service';
import { EVENTS } from '@/utils/constants';
import Cookies from 'js-cookie';
// import Loader from '@/components/core/loader';

interface ISpeakerRequestForm {
  userInfo: IUserInfo | null;
  eventLocationSummary: any;
  onClose: () => void;
  isLoggedIn: boolean;
}

interface ITopicOption {
  id: string;
  name: string;
}

const SpeakerRequestForm: React.FC<ISpeakerRequestForm> = ({ userInfo, eventLocationSummary, isLoggedIn, onClose }) => {
  const analytics = useIrlAnalytics();
  const formBodyRef = useRef<HTMLDivElement>(null);
  const [speakerDescription, setSpeakerDescription] = useState('');
  const authToken = Cookies.get('authToken') || '';

  // Commented out for future use - customTags implementation
  // const [customTags, setCustomTags] = useState<string[]>([]);
  // const [inputValue, setInputValue] = useState('');
  
  // MultiSelect topics implementation
  const [selectedTopics, setSelectedTopics] = useState<ITopicOption[]>([]);
  const [customTopics, setCustomTopics] = useState<ITopicOption[]>([]);
  const allData = useGetTeamsFormOptions();
  const industryTags = allData?.industryTags || [];

  // Combine industry tags with custom topics
  const allTopics = useMemo(() => {
    return [...(industryTags || []), ...customTopics];
  }, [industryTags, customTopics]);
  
  const [isCloseClicked, setIsCloseClicked] = useState(false);
  const [memberData, setMemberData] = useState<any>(null);
  const [isLoadingMember, setIsLoadingMember] = useState(false);
  const isReadOnlyMode = false;

  // Social handles mapping - same as ContactDetails
  // Handle both "Handle" and "Handler" property names
  const SOCIAL_TO_HANDLE_MAP: Record<string, string[]> = {
    linkedin: ['linkedinHandle', 'linkedinHandler'],
    github: ['githubHandle', 'githubHandler'],
    twitter: ['twitter', 'twitterHandler'],
    email: ['email'],
    discord: ['discordHandle', 'discordHandler'],
    telegram: ['telegramHandle', 'telegramHandler'],
  };

  // Fetch member data on component mount
  useEffect(() => {
    const fetchMemberData = async () => {
      if (!userInfo?.uid || !isLoggedIn) {
        return;
      }

      try {
        setIsLoadingMember(true);
        const memberResult = await getMember(
          userInfo.uid,
          { with: 'image,skills,location,teamMemberRoles.team' },
          isLoggedIn,
          userInfo,
          false,
          true,
        );

        if (!memberResult.error && memberResult?.data?.formattedData) {
          setMemberData(memberResult.data.formattedData);
        }
      } catch (error) {
        console.error('Error fetching member data:', error);
      } finally {
        setIsLoadingMember(false);
      }
    };

    fetchMemberData();
  }, [userInfo?.uid, isLoggedIn]);

  const VISIBLE_HANDLES = ['linkedin', 'github', 'twitter', 'email', 'discord', 'telegram'];

  // Extract user title from member data - Format: "TeamName, Role"
  // useMemo is used here to memoize the computed value and prevent unnecessary recalculations
  // on every render. It only recalculates when memberData changes, improving performance.
  const userTitle = useMemo(() => {
    if (!memberData) return '';

    let teamName = '';
    let role = '';

    // Get team name from mainTeam or first teamAndRoles entry
    if (memberData.mainTeam?.name) {
      teamName = memberData.mainTeam.name;
    } else if (memberData.teamAndRoles && memberData.teamAndRoles.length > 0) {
      teamName = memberData.teamAndRoles[0].teamTitle || '';
    }

    // Get role from memberData.role or first teamAndRoles entry
    if (memberData.mainTeam?.role) {
      role = memberData.mainTeam.role;
    } else if (memberData.teamAndRoles && memberData.teamAndRoles.length > 0) {
      role = memberData.teamAndRoles[0].role || '';
    }

    // Format as "TeamName, Role" or just "Role" if no team name
    if (teamName && role) {
      return `${teamName}, ${role}`;
    } else if (role) {
      return role;
    } else if (teamName) {
      return teamName;
    }

    return '';
  }, [memberData]);

  // Extract social handles from member data
  const socialHandles = useMemo(() => {
    if (!memberData) return [];

    const memberRecord = memberData as unknown as Record<string, string>;

    return VISIBLE_HANDLES.map((type) => {
      const handleKeys = SOCIAL_TO_HANDLE_MAP[type];
      // Try each possible property name
      let handle: string | undefined;
      for (const key of handleKeys) {
        if (memberRecord[key]) {
          handle = memberRecord[key];
          break;
        }
      }
      
      if (!handle) return null;

      const profile = getProfileFromURL(handle, type);
      
      return {
        type,
        handle,
        profile,
      };
    }).filter(Boolean) as Array<{ type: string; handle: string; profile: string }>;
  }, [memberData]);

  // Get user avatar, name from member data or userInfo
  const userAvatar = memberData?.profile || (userInfo as any)?.image?.url || getDefaultAvatar(userInfo?.name || '');
  const userName = memberData?.name || userInfo?.name || 'User';

  // Get logo by provider
  const getLogoByProvider = (provider: string): string => {
    switch (provider) {
      case 'linkedin':
        return '/icons/contact/linkedIn-contact-logo.svg';
      case 'discord':
        return '/icons/contact/discord-contact-logo.svg';
      case 'email':
        return '/icons/contact/email-contact-logo.svg';
      case 'github':
        return '/icons/contact/github-contact-logo.svg';
      case 'telegram':
        return '/icons/contact/telegram-contact-logo.svg';
      case 'twitter':
        return '/icons/contact/twitter-contact-logo.svg';
      default:
        return '/icons/contact/website-contact-logo.svg';
    }
  };


  // Social link callback (for analytics if needed)
  const handleSocialLinkClick = (type: string, url: string) => {
    // Can add analytics tracking here if needed
    console.log('Social link clicked:', type, url);
  };

  // MultiSelect helper functions
  const addTopic = (setState: React.Dispatch<React.SetStateAction<ITopicOption[]>>, itemToAdd: ITopicOption) => {
    setState((prevItems: ITopicOption[]) => {
      return [...prevItems, itemToAdd];
    });
  };

  const removeTopic = (setState: React.Dispatch<React.SetStateAction<ITopicOption[]>>, itemToRemove: ITopicOption) => {
    setState((prevItems: ITopicOption[]) => {
      const newItems = prevItems.filter((item) => item.id !== itemToRemove.id);
      return newItems;
    });
  };

  // Handle adding custom topic
  const handleAddCustomTopic = (customValue: string) => {
    if (!customValue.trim()) {
      return;
    }

    // Check if topic already exists (case-insensitive)
    const exists = allTopics.some(
      (topic) => topic.name.toLowerCase() === customValue.toLowerCase()
    );

    if (exists) {
      toast.error('This topic already exists');
      return;
    }

    // Create new custom topic
    const newTopic: ITopicOption = {
      id: `custom_${Date.now()}_${customValue.trim().toLowerCase().replace(/\s+/g, '_')}`,
      name: customValue.trim(),
    };

    // Add to custom topics and selected topics
    setCustomTopics((prev) => [...prev, newTopic]);
    setSelectedTopics((prev) => [...prev, newTopic]);
  };


  const handleSubmit = async () => {
    if (!speakerDescription.trim()) {
      toast.error('Please enter a speaker description');
      return;
    }

    if (selectedTopics.length === 0) {
      toast.error('Please select at least one topic');
      return;
    }

    try {
      // TODO: Implement API call to submit speaker request
      const response = await submitSpeakerRequest({
        memberUid: userInfo?.uid,
        description: speakerDescription,
        tags: selectedTopics.map(topic => topic.name),
      }, authToken || '');

      if(response?.error) {
        toast.error('Failed to submit speaker request. Please try again.');
        analytics.trackSpeakerRequestFormSubmitBtnClicked(eventLocationSummary, userInfo);
        return;
      }
      else if(response?.data) {
        toast.success('Speaker request submitted successfully!');
        analytics.trackSpeakerRequestFormSubmitBtnClicked(eventLocationSummary, userInfo);
      }
      
      // Dispatch event to update button state
      document.dispatchEvent(
        new CustomEvent(EVENTS.SPEAKER_REQUEST_SUBMITTED, {
          detail: { 
            locationId: eventLocationSummary?.uid,
            memberUid: userInfo?.uid,
            description: speakerDescription,
            tags: selectedTopics.map(topic => topic.name),
            isSubmitted: true 
          },
        }),
      );
      
      handleClose();
    } catch (error) {
      toast.error('Failed to submit speaker request. Please try again.');
      console.error('Error submitting speaker request:', error);
    }
  };

  // Commented out for future use - customTags handlers
  // const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
  //   if (e.key === 'Enter' && inputValue.trim()) {
  //     e.preventDefault();
  //     e.stopPropagation();
  //     if (!customTags.includes(inputValue.trim())) {
  //       setCustomTags([...customTags, inputValue.trim()]);
  //     }
  //     setInputValue('');
  //   }
  // };

  // const handleTagDelete = (index: number) => {
  //   setCustomTags(customTags.filter((_, i) => i !== index));
  // };

  const onCloseClicked = () => {
    setIsCloseClicked(true);

    setTimeout(() => {
      setIsCloseClicked(false);
    }, 60000);
  };

  const handleClose = () => {
    onClose();
    analytics.trackSpeakerRequestFormCloseBtnClicked(eventLocationSummary, userInfo);
  };

  if(isLoadingMember) {
    return <PageLoader/>;
  }

  return (
    <div className="speakerRequestFormCnt">
      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit();
        }}
        className="speakerRequestForm"
      >
        <div className="speakerRequestForm__container" ref={formBodyRef}>
          <div className="speakerRequestForm__container__header">
            <div className="speakerRequestForm__container__header__title">Request to be a speaker</div>
            <div className="speakerRequestForm__container__header__closeBtn">
              <img src="/icons/close.svg" alt="close" height={20} width={20} onClick={handleClose} />
            </div>
          </div>

          <div className="speakerRequestForm__container__body">
            {/* Requesting as Section */}
            <div className="speakerRequestForm__body__requestingAsSection">
              <span className="speakerRequestForm__body__requestingAsSection__label">Requesting as</span>
              <div className="speakerRequestForm__body__requestingAsSection__content">
                <div className="speakerRequestForm___requestingAsSection__content__userInfo">
                  <div className="speakerRequestForm__userInfo__avatar">
                    <Image
                      src={userAvatar}
                      alt={userName}
                      width={48}
                      height={48}
                      className="speakerRequestForm__userInfo__avatarImg"
                    />
                  </div>
                  <div className="speakerRequestForm__userInfo__details">
                    <div className="speakerRequestForm__userInfo__details__username">{userName}</div>
                    {userTitle && <div className="speakerRequestForm__userInfo__details__userTitle">{userTitle}</div>}
                  </div>
                </div>
                {socialHandles.length > 0 && (
                      <div className="speakerRequestForm___requestingAsSection__content__userSocialHandles">
                        {socialHandles.map((social, index) => (
                          <div key={social.type} className="speakerRequestForm___userSocialHandles__section">
                            <ProfileSocialLink
                              type={social.type}
                              profile={social.profile}
                              handle={social.handle}
                              logo={getLogoByProvider(social.type)}
                              height={12}
                              width={12}
                              callback={handleSocialLinkClick}
                              className={`speakerRequestForm___userSocialHandles__section__link ${
                                index === 0 ? 'speakerRequestForm___userSocialHandles__section__link--first' : ''
                              } ${
                                index === socialHandles.length - 1
                                  ? 'speakerRequestForm___userSocialHandles__section__link--last'
                                  : ''
                              }`}
                            />
                            {index < socialHandles.length - 1 && (
                              <span className="speakerRequestForm__divider">|</span>
                            )}
                          </div>
                        ))}
                      </div>
                )}
              </div>
            </div>

            {/* Speaker Description */}
            <div className="speakerRequestForm__body__speakerdescriptionSection">
              <label className="speakerRequestForm__body__speakerdescriptionSection__label">
                Speaker Description
                <span className="speakerRequestForm__body__speakerdescriptionSection__required">*</span>
              </label>
              <textarea
                className="speakerRequestForm__body__speakerdescriptionSection__textarea"
                placeholder="Enter a short description about you or your speech"
                value={speakerDescription}
                onChange={(e) => setSpeakerDescription(e.target.value)}
                rows={4}
              />
            </div>

            {/* Topics Section */}
            <div className="speakerRequestForm__body__topicSection">
              <MultiSelect
                options={allTopics}
                selectedOptions={selectedTopics}
                onAdd={(itemToAdd) => addTopic(setSelectedTopics, itemToAdd)}
                onRemove={(itemToRemove) => removeTopic(setSelectedTopics, itemToRemove)}
                uniqueKey="id"
                displayKey="name"
                label={
                  <>
                    What Would You Like to Talk About?
                    <span className="speakerRequestForm__body__topicSection__required">*</span>
                  </>
                }
                placeholder="Search or select topics..."
                isMandatory
                closeImgUrl="/icons/close.svg"
                arrowImgUrl="/icons/arrow-down.svg"
                onAddCustom={handleAddCustomTopic}
                customTagLabel="Add Custom Tag"
              />
            </div>
          </div>
        </div>

        <div className="speakerRequestForm__footer">
          {isCloseClicked && (
            <button className="speakerRequestForm__footer__cancelBtn" onClick={handleClose}>
              Confirm Close?
            </button>
          )}
          {!isCloseClicked && (
            <button type="button" onClick={onCloseClicked} className="speakerRequestForm__footer__cancelBtn">
              Close
            </button>
          )}
          <button type="submit" className="speakerRequestForm__footer__submitBtn">
            Send Request
          </button>
        </div>
      </form>

      <style jsx>{`
        .speakerRequestFormCnt {
          position: fixed;
          z-index: 5;
          top: 0;
          bottom: 0;
          right: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          display: flex;
          justify-content: center;
          align-items: center;
          background: rgba(0, 0, 0, 0.5);
        }

        .speakerRequestForm {
          padding: 20px;
          width: 90vw;
          height: auto;
          max-height: 90vh;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          background: white;
          border-radius: 12px;
          position: relative;
        }

        .speakerRequestForm__closeBtn {
          display: flex;
          justify-content: end;
          align-items: center;
          cursor: pointer;
        }

        .speakerRequestForm__container {
          flex: 1;
          overflow: auto;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .speakerRequestForm__container__header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .speakerRequestForm__container__header__title {
          font-weight: 700;
          font-size: 20px;
          line-height: 32px;
          color: rgba(15, 23, 42, 1);
        }

        .speakerRequestForm__container__header__closeBtn {
          cursor: pointer;
        }

        .speakerRequestForm__container__body {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .speakerRequestForm__body__requestingAsSection {
          position: relative;
          background-color: rgba(248, 250, 252, 1);
          border: 1px solid rgba(219, 234, 254, 1);
          border-radius: 8px;
          padding: 28px 20px 16px 20px;
          margin-top: 12px;
        }

        .speakerRequestForm__body__requestingAsSection__label {
          position: absolute;
          top: -14px;
          left: 16px;
          background-color: rgba(255, 255, 255, 1);
          color: rgba(71, 85, 105, 1);
          font-size: 14px;
          font-weight: 500;
          line-height: 20px;
          padding: 4px 10px;
          border-radius: 20px;
          border: 1px solid rgba(219, 234, 254, 1);
          white-space: nowrap;
          z-index: 1;
        }

        .speakerRequestForm__body__requestingAsSection__content {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .speakerRequestForm___requestingAsSection__content__userInfo {
          display: flex;
          gap: 16px;
          align-items: flex-start;
        }

        .speakerRequestForm__userInfo__avatar {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          overflow: hidden;
          flex-shrink: 0;
        }

        .speakerRequestForm__userInfo__avatarImg {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .speakerRequestForm__userInfo__details {
          display: flex;
          flex-direction: column;
          gap: 4px;
          flex: 1;
        }

        .speakerRequestForm__userInfo__details__username {
          font-size: 16px;
          font-weight: 600;
          line-height: 24px;
          color: rgba(15, 23, 42, 1);
        }

        .speakerRequestForm__userInfo__details__userTitle {
          font-size: 14px;
          font-weight: 400;
          letter-spacing: 0%;
          line-height: 20px;
          color: rgba(107, 114, 128, 1);
          margin-bottom: 8px;
        }

        .speakerRequestForm___requestingAsSection__content__userSocialHandles {
          padding: 4px 8px;
          height: 28px;
        }

        .speakerRequestForm___userSocialHandles__section {
          display: inline-flex;
          flex-wrap: wrap;
          align-items: center;
          background-color: rgba(241, 245, 249, 1);
        }

        .speakerRequestForm___userSocialHandles__section__link {
          display: inline-flex;
          align-items: center;
        }

        .speakerRequestForm___userSocialHandles__section__link :global(.profile-social-link) {
          background: transparent;
          padding: 6px 10px;
          border-radius: 0;
          border: none;
        }

        .speakerRequestForm___userSocialHandles__section__link :global(.profile-social-link__link) {
          font-weight: 400;
          font-size: 12px;
          line-height: 20px;
          color: rgba(15, 23, 42, 1);

        }

        .speakerRequestForm__divider {
          color: rgba(226, 232, 240, 1);
          font-size: 14px;
          line-height: 16px;
          display: inline-flex;
          align-items: center;
        }

        .speakerRequestForm__body__speakerdescriptionSection, .speakerRequestForm__body__topicSection {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .speakerRequestForm__body__speakerdescriptionSection__label, .speakerRequestForm__body__topicSection__label {
          font-size: 14px;
          font-weight: 600;
          line-height: 20px;
          color: #0f172a;
        }

        .speakerRequestForm__body__speakerdescriptionSection__required, .speakerRequestForm__body__topicSection__required {
          margin-left: 2px;
        }

        /* Commented out for future use - customTags CSS styles */
        /* .speakerRequestForm__body__topicSection__tag-inputContainer {
          border-radius: 4px;
        }

        .speakerRequestForm__tag-inputContainer__wrapper {
          display: flex;
          width: 100%;
          gap: 8px;
          flex-wrap: wrap;
          align-items: center;
          font-size: 14px;
          border: 1px solid rgba(203, 213, 225, 1);
          border-radius: 8px;
        }

        .tag-grid {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }

        .speakerRequestForm__tag-inputContainer__chip {
          display: flex;
          align-items: center;
          background: #effbfc;
          border: 1px solid #585858;
          border-radius: 4px;
          padding: 8px;
        }

        .speakerRequestForm__tag-inputContainer__delete {
          cursor: pointer;
          font-size: 20px;
          margin-left: 8px;
        }

        .speakerRequestForm__tag-inputContainer__field {
          display: flex;
          align-items: center;
          flex: 1;
          padding: 14px;
        }

        .speakerRequestForm__tag-inputContainer__field-full {
          display: flex;
          align-items: center;
          width: 100%;
        }

        .input-element {
          width: 100%;
          outline: none;
          border: none;
          outline: none;
          font-size: 14px !important;
          line-height: 20px;
          background: inherit;
          font-family: inherit;
        }

        .input-element::placeholder {
          font-size: 14px;
          color: rgb(149,164,185);
        } */

        .speakerRequestForm__body__speakerdescriptionSection__textarea {
          width: 100%;
          padding: 12px;
          border: 1px solid rgba(203, 213, 225, 1);
          border-radius: 8px;
          font-size: 14px;
          font-family: inherit;
          line-height: 20px;
          color: #0f172a;
          resize: vertical;
          outline: none;
        }

        .speakerRequestForm__body__speakerdescriptionSection__textarea::placeholder {
          color: #94a3b8;
        }

        .speakerRequestForm__footer {
          height: 80px;
          display: flex;
          justify-content: end;
          align-items: center;
          margin-top: 10px;
          gap: 8px;
        }

        .speakerRequestForm__footer__cancelBtn {
          padding: 10px 24px;
          border: 1px solid rgba(203, 213, 225, 1);
          background: #ffffff;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 500;
          line-height: 20px;
          cursor: pointer;
          height: 40px;
          box-shadow: 0px 1px 1px 0px rgba(15, 23, 42, 0.08);
        }

        .speakerRequestForm__footer__submitBtn {
          padding: 10px;
          background: rgba(21, 111, 247, 1);
          border: 1px solid rgba(203, 213, 225, 1);
          border-radius: 8px;
          font-size: 14px;
          font-weight: 500;
          line-height: 20px;
          color: #ffffff;
          cursor: pointer;
          height: 40px;
          box-shadow: 0px 1px 1px 0px rgba(15, 23, 42, 0.08);
        }

        .speakerRequestForm__footer__submitBtn:hover {
          background: #1d4ed8;
        }

        @media (min-width: 360px) {
          .speakerRequestForm___requestingAsSection__content__userInfo {
            flex-direction: row;
            align-items: flex-start;
          }

          .speakerRequestForm__userInfo__avatar {
            margin-bottom: 8px;
          }
        }

        @media (min-width: 768px) {
          .speakerRequestForm__userInfo__avatar {
            margin-bottom: 0;
          }
        }

        @media (min-width: 1024px) {
          .speakerRequestForm {
            width: 680px;
          }
        }
      `}</style>
    </div>
  );
};

export default SpeakerRequestForm;