'use client';
import Image from 'next/image';

export default function PopupTriggerIconButton({ iconImgUrl ,label,size ,alt, triggerEvent,data, callback}: { iconImgUrl?: string, label?: string, size?: number, alt: string, triggerEvent: string, data: any, callback?: any }) {
  
  const handleClick = () => {
    document.dispatchEvent(new CustomEvent(triggerEvent, { detail: data }));
    if(callback){
      callback()
    }
  };
  
  return (
    <>
    <button className={'icon-button'} onClick={handleClick}>
      {
        iconImgUrl && (
          <Image src={iconImgUrl} alt={alt} width={size} height={size} />
        )
      }
      {
        label && (
          <span className='icon-button__label'>{label}</span>
        )
      }
    </button>
    <style jsx>{`
      .icon-button {
        display: flex;
        align-items: center;
        gap: 4px;
      }
      .icon-button__label {
        color: #156ff7;
      }
    `}</style>
    </>
  );
}

    