import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { toast } from '@/components/core/ToastContainer';
import { EVENTS } from '@/utils/constants';
import { IUserInfo } from '@/types/shared.types';
import { getDefaultAvatar } from '@/hooks/useDefaultAvatar';
import { useIrlAnalytics } from '@/analytics/irl.analytics';

interface ISpeakerRequestForm {
  userInfo: IUserInfo | null;
  eventLocationSummary: any;
  onClose: () => void;
}

const SpeakerRequestForm: React.FC<ISpeakerRequestForm> = ({ userInfo, eventLocationSummary, onClose }) => {
  const analytics = useIrlAnalytics();
  const formBodyRef = useRef<HTMLDivElement>(null);
  const [speakerDescription, setSpeakerDescription] = useState('');
  const [customTags, setCustomTags] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isCloseClicked, setIsCloseClicked] = useState(false);
  const isReadOnlyMode = false;
  const userAvatar = (userInfo as any)?.image?.url || getDefaultAvatar(userInfo?.name || '');
  const userName = userInfo?.name || 'User';
  const userTitle = (userInfo as any)?.title || (userInfo as any)?.teamMemberRoles?.[0]?.role || '';
  const telegramHandle = (userInfo as any)?.telegramHandler || '';
  const email = (userInfo as any)?.email || '';

  const handleSubmit = async () => {
    if (!speakerDescription.trim()) {
      toast.error('Please enter a speaker description');
      return;
    }

    if (customTags.length === 0) {
      toast.error('Please enter at least one topic');
      return;
    }

    try {
      // TODO: Implement API call to submit speaker request
      // const response = await submitSpeakerRequest({
      //   locationId: eventLocationSummary.uid,
      //   description: speakerDescription,
      //   topics: customTags,
      // });

      // For now, just show success message
      toast.success('Speaker request submitted successfully!');
      // TODO: Add analytics tracking when method is available
      // analytics.trackSpeakerRequestSubmitted(eventLocationSummary, {
      //   description: speakerDescription,
      //   topics: selectedTopics,
      // });
      handleClose();
    } catch (error) {
      toast.error('Failed to submit speaker request. Please try again.');
      console.error('Error submitting speaker request:', error);
    }
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      e.preventDefault();
      e.stopPropagation();
      if (!customTags.includes(inputValue.trim())) {
        setCustomTags([...customTags, inputValue.trim()]);
      }
      setInputValue('');
    }
  };

  const handleTagDelete = (index: number) => {
    setCustomTags(customTags.filter((_, i) => i !== index));
  };

  const onCloseClicked = () => {
    setIsCloseClicked(true);

    setTimeout(() => {
      setIsCloseClicked(false);
    }, 60000);
  };

  const handleClose = () => {
    onClose();
  };

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
        <div className="speakerRequestForm__closeBtn">
          <img
            src="/icons/close.svg"
            alt="close"
            height={20}
            width={20}
            onClick={handleClose}
          />
        </div>
        <div className="speakerRequestForm__bdy" ref={formBodyRef}>
          <h2 className="speakerRequestForm__bdy__ttl">Request to be a speaker</h2>

          <div className="speakerRequestForm__details">
            {/* Requesting as Section */}
            <div className="speakerRequestForm__requestingAs">
              <span className="speakerRequestForm__requestingAs__label">Requesting as</span>
              <div className="speakerRequestForm__requestingAs__content">
                <div className="speakerRequestForm__userInfo">
                  <div className="speakerRequestForm__avatar">
                    <Image
                      src={userAvatar}
                      alt={userName}
                      width={48}
                      height={48}
                      className="speakerRequestForm__avatarImg"
                    />
                  </div>
                  <div className="speakerRequestForm__userDetails">
                    <div className="speakerRequestForm__userName">{userName}</div>
                    {userTitle && <div className="speakerRequestForm__userTitle">{userTitle}</div>}
                    <div className="speakerRequestForm__userTags">
                      {telegramHandle && (
                        <span className="speakerRequestForm__tag speakerRequestForm__tag--telegram">
                          <img src="/icons/telegram-solid.svg" alt="telegram" width={12} height={12} />
                          {telegramHandle}
                        </span>
                      )}
                      {email && (
                        <>
                          <span className="speakerRequestForm__tag speakerRequestForm__tag--email">
                            <span className="speakerRequestForm__tag__at">@</span>
                            {email}
                          </span>
                          <span className="speakerRequestForm__tag speakerRequestForm__tag--email">
                            <span className="speakerRequestForm__tag__at">@</span>
                            {email}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Speaker Description */}
            <div className="speakerRequestForm__section">
              <label className="speakerRequestForm__label">
                Speaker Description<span className="speakerRequestForm__required">*</span>
              </label>
              <textarea
                className="speakerRequestForm__textarea"
                placeholder="Enter a short description about you or your speech"
                value={speakerDescription}
                onChange={(e) => setSpeakerDescription(e.target.value)}
                rows={4}
              />
            </div>

            {/* Topics Section */}
            <div className="speakerRequestForm__section">
              <label className="speakerRequestForm__label">
                What Would You Like to Talk About?<span className="speakerRequestForm__required">*</span>
              </label>
              <div className="tag-input-container">
                <div className="tag-input-wrapper">
                  {customTags.map((tag: string, index: number) => (
                    <div key={index} className="tag-chip">
                      {tag}
                      <span className="tag-delete" onClick={() => handleTagDelete(index)}>
                        <img src="/icons/close.svg" alt="close" height={16} width={16} />
                      </span>
                    </div>
                  ))}
                  <div className="tag-input-field">
                    <input
                      type="text"
                      enterKeyHint="done"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      disabled={isReadOnlyMode}
                      onKeyDown={handleInputKeyDown}
                      placeholder="Type your tag here"
                      className="input-element"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="speakerRequestForm__optns">
          {isCloseClicked && (
            <button className="speakerRequestForm__cancelBtn" onClick={handleClose}>
              Confirm Close?
            </button>
          )}
          {!isCloseClicked && (
            <button type="button" onClick={onCloseClicked} className="speakerRequestForm__cancelBtn">
              Close
            </button>
          )}
          <button type="submit" className="speakerRequestForm__submitBtn">
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

        .speakerRequestForm__bdy {
          flex: 1;
          overflow: auto;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .speakerRequestForm__bdy__ttl {
          font-size: 17px;
          font-weight: 600;
        }

        .speakerRequestForm__details {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .speakerRequestForm__requestingAs {
          position: relative;
          background-color: rgba(248, 250, 252, 1);
          border: 1px solid rgba(219, 234, 254, 1);
          border-radius: 8px;
          padding: 28px 20px 16px 20px;
          margin-top: 12px;
        }

        .speakerRequestForm__requestingAs__label {
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

        .speakerRequestForm__requestingAs__content {
          display: flex;
          flex-direction: column;
        }

        .speakerRequestForm__userInfo {
          display: flex;
          gap: 12px;
          align-items: flex-start;
        }

        .speakerRequestForm__avatar {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          overflow: hidden;
          flex-shrink: 0;
        }

        .speakerRequestForm__avatarImg {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .speakerRequestForm__userDetails {
          display: flex;
          flex-direction: column;
          gap: 4px;
          flex: 1;
        }

        .speakerRequestForm__userName {
          font-size: 16px;
          font-weight: 600;
          line-height: 24px;
          color: #0f172a;
          margin-bottom: 4px;
        }

        .speakerRequestForm__userTitle {
          font-size: 14px;
          font-weight: 400;
          line-height: 20px;
          color: #64748b;
          margin-bottom: 8px;
        }

        .speakerRequestForm__userTags {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin-top: 8px;
          align-items: center;
        }

        .speakerRequestForm__tag {
          font-size: 12px;
          font-weight: 500;
          line-height: 16px;
          color: #475569;
          background: #f1f5f9;
          padding: 6px 10px;
          border-radius: 16px;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          border: 0.5px solid #e2e8f0;
        }

        .speakerRequestForm__tag--telegram {
          color: #475569;
        }

        .speakerRequestForm__tag--telegram img {
          width: 14px;
          height: 14px;
          opacity: 0.9;
        }

        .speakerRequestForm__tag--email {
          color: #475569;
        }

        .speakerRequestForm__tag__at {
          color: #ffffff;
          background: #94a3b8;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          font-weight: 600;
          flex-shrink: 0;
        }

        .speakerRequestForm__section {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .speakerRequestForm__label {
          font-size: 14px;
          font-weight: 600;
          line-height: 20px;
          color: #0f172a;
        }

        .speakerRequestForm__required {
          margin-left: 2px;
        }

        .tag-input-container {
          border-radius: 4px;
        }

        .tag-input-wrapper {
          display: flex;
          width: 100%;
          padding: 4px;
          gap: 8px;
          flex-wrap: wrap;
          align-items: center;
          border: 1px solid #cbd5e1;
          border-radius: 4px;
        }

        .tag-grid {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }

        .tag-chip {
          display: flex;
          align-items: center;
          background: #effbfc;
          border: 1px solid #585858;
          border-radius: 4px;
          padding: 10px 14px;
        }

        .tag-delete {
          cursor: pointer;
          font-size: 20px;
          margin-left: 8px;
        }

        .tag-input-field {
          display: flex;
          align-items: center;
          flex: 1;
          padding: 14px;
        }

        .tag-input-field-full {
          display: flex;
          align-items: center;
          width: 100%;
        }

        .input-element {
          width: 100%;
          outline: none;
          border: none;
          outline: none;
          font-weight: 400;
          font-size: 14px;
          line-height: 20px;
          background: inherit;
        }

        .input-element::placeholder {
          font-size: 14px;
          color: #64748b;
          opacity: 0.5;
        }

        .speakerRequestForm__textarea {
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

        .speakerRequestForm__textarea::placeholder {
          color: #94a3b8;
        }

        .speakerRequestForm__optns {
          height: 80px;
          display: flex;
          justify-content: end;
          align-items: center;
          margin-top: 10px;
          gap: 8px;
        }

        .speakerRequestForm__cancelBtn {
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

        .speakerRequestForm__submitBtn {
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

        .speakerRequestForm__submitBtn:hover {
          background: #1d4ed8;
        }

        @media (min-width: 360px) {
          .speakerRequestForm__userInfo {
            flex-direction: row;
            align-items: flex-start;
          }

          .speakerRequestForm__avatar {
            margin-bottom: 8px;
          }
        }

        @media (min-width: 768px) {
          .speakerRequestForm__avatar {
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
