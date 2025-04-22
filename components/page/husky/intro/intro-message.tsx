import { Message, useChat } from 'ai/react';
import SingleSelect from './single-select';
import SearchMembers from './search-members';
import SelectTags from './select-tags';
import RequestIntroduction from './request-introduction';

interface IntroMessageProps {
  message: Message;
  setInput: (input: string) => void;
  handleSubmit: any;
  userInfo: any;
  append: (message: Message) => void;
}

const   IntroMessage = ({ message, setInput, handleSubmit, userInfo, append }: IntroMessageProps) => {
  if (!message.parts) {
    return <div>{message.content}</div>;
  }

  // Generate a random chat ID for the session
  const generateRandomId = () => {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  };
  
  

  const onOptionSelect = (option: string) => {
    const chatId = generateRandomId();
    append({
        id: chatId,
        role: 'user',
        content: option,
    });
  };

  const onTagsSelectHandler = (tags: string[]) => {
    const chatId = generateRandomId();
    append({
      id: chatId,
      role: 'user',
      content: tags.join(', '),
    });
  };

  const onMemberSelectHandler = (member: any) => {
    const chatId = generateRandomId();
    append({
      id: chatId,
      role: 'user',
      content: member?.name,
    });
  };
  return (
    <>
      {message.parts.map((part: any, index) => {
        if (part.type === 'tool-invocation') {
          const toolName = part.toolInvocation.toolName;
          
          switch (toolName) {
            case 'getInitialOptions':
            case 'getIntroductionOptions':
              return <SingleSelect question={part?.toolInvocation?.result?.question} options={part?.toolInvocation?.result?.options} onSelect={onOptionSelect} />;

            case 'searchMembers':
              return <SearchMembers message={part} onMemberSelect={onMemberSelectHandler} />;

            case 'selectTags':
              return <SelectTags message={part} onTagsSelect={onTagsSelectHandler} />;

            case 'requestIntroduction':
              return <RequestIntroduction message={part} />;
          }
        }

        if (part.type === 'text' && message.role === 'user') {
          return (
            <div className="intro-message-user-text-container">
              <div className="intro-message-user-text-container__text">{part.text}</div>
              <img src={userInfo.profileImageUrl ? userInfo.profileImageUrl : '/icons/default_profile.svg'} className="intro-message-user-text-container__profile-image" />
            </div>
          );
        }

        if (part.type === 'text' && message.role === 'assistant') {
          return (
            <div className="intro-message-assistant-text-container">
              <img src="/images/husky/intro-assistant.svg" alt="assistant" className="intro-message-assistant-text-container__profile-image" />
              <div className="intro-message-assistant-text-container__text">{part.text}</div>
            </div>
          );
        }
      })}

      <style jsx>
        {`
          .intro-message-user-text-container {
            display: flex;
            justify-content: space-between;
            gap: 20px;
            align-items: center;
            padding: 12px 14px;
            background-color: white;
            border-radius: 8px;
            border: 1px solid  #E2E8F0;
          }

          .intro-message-user-text-container__text {
            font-weight: 400;
            font-size: 14px;
            line-height: 22px;
          }

          .intro-message-user-text-container__profile-image {
            width: 32px;
            height: 32px;
            border-radius: 50%;
          }

          .intro-message-assistant-text-container {
            display: flex;
            gap: 20px;
            align-items: start;
            padding: 17px 14px;
            background-color: white;
            border-radius: 8px;
          }

          .intro-message-assistant-text-container__text {
            font-weight: 400;
            font-size: 14px;
            line-height: 22px;
          }

          .intro-message-assistant-text-container__profile-image {
            width: 32px;
            height: 32px;
            border-radius: 50%;
          }
        `}
      </style>
    </>
  );
};

export default IntroMessage;
