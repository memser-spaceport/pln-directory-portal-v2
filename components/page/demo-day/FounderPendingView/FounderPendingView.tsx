import React from 'react';
import s from './FounderPendingView.module.scss';
import { getParsedValue } from '@/utils/common.utils';
import Cookies from 'js-cookie';
import { IUserInfo } from '@/types/shared.types';
import { useGetDemoDayState } from '@/services/demo-day/hooks/useGetDemoDayState';

export const FounderPendingView = () => {
  const userInfo: IUserInfo = getParsedValue(Cookies.get('userInfo'));
  const { data } = useGetDemoDayState();

  // Format the date from the API data
  const formatEventDate = (dateString: string) => {
    const date = new Date(dateString);
    const time = date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
    const day = date.getDate();
    const month = date.toLocaleDateString('en-US', { month: 'short' });
    const year = date.getFullYear();

    return { time, day, month, year };
  };

  const eventDate = data?.date
    ? formatEventDate(data.date)
    : {
        time: '19:00',
        day: '25',
        month: 'Oct',
        year: '2025',
      };

  return (
    <div className={s.root}>
      <div className={s.eventHeader}>
        {/* Background decorative elements */}
        <div className={s.backgroundAccents}>
          <div className={s.accentsImage} />
        </div>
        <div className={s.backgroundVector}>
          <div className={s.vectorImage} />
        </div>

        {/* Main content */}
        <div className={s.content}>
          {/* Date and time section */}
          <div className={s.dateSection}>
            <div className={s.dateContainer}>
              <span className={s.dateLabel}>Date:</span>
              <span className={s.timeValue}>{eventDate.time}</span>
              <div className={s.divider} />
              <span className={s.dateValue}>{eventDate.day}</span>
              <div className={s.divider} />
              <span className={s.dateValue}>{eventDate.month}</span>
              <div className={s.divider} />
              <span className={s.dateValue}>{eventDate.year}</span>
            </div>
          </div>

          {/* Headline section */}
          <div className={s.headline}>
            <h1 className={s.title}>{data?.title || 'PL Demo Day'}</h1>
            <p className={s.description}>{data?.description || 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.'}</p>
          </div>

          {/* Video preview section */}
          <VideoPreview />
        </div>
      </div>

      <Alert />

      <div>profile</div>
    </div>
  );
};

const PlayButton = () => (
  <svg width="289" height="289" viewBox="0 0 289 289" fill="none" xmlns="http://www.w3.org/2000/svg">
    <foreignObject x="40.9369" y="66.5204" width="206.573" height="206.573">
      <div
        style={{
          backdropFilter: 'blur(5.03px)',
          height: '100%',
          width: '100%',
          clipPath: 'url(#bgblur_0_7495_53865_clip_path)',
        }}
      ></div>
    </foreignObject>
    <g filter="url(#filter0_d_7495_53865)" data-figma-bg-blur-radius="10.0507">
      <path
        d="M144.223 199.997C175.026 199.997 199.997 175.026 199.997 144.223C199.997 113.42 175.026 88.4492 144.223 88.4492C113.42 88.4492 88.4492 113.42 88.4492 144.223C88.4492 175.026 113.42 199.997 144.223 199.997Z"
        fill="#1A91FF"
        fillOpacity="0.7"
        shapeRendering="crispEdges"
      />
    </g>
    <path
      opacity="0.4"
      d="M144.364 62.8848C189.364 62.8849 225.844 99.3643 225.844 144.364C225.844 189.364 189.364 225.844 144.364 225.844C99.3643 225.844 62.8849 189.364 62.8848 144.364C62.8848 99.3643 99.3643 62.8848 144.364 62.8848Z"
      stroke="#1A91FF"
      strokeWidth="1.8274"
    />
    <path
      opacity="0.3"
      d="M144.364 32.375C206.214 32.3751 256.354 82.5143 256.354 144.364C256.353 206.214 206.214 256.353 144.364 256.354C82.5143 256.354 32.3751 206.214 32.375 144.364C32.375 82.5142 82.5142 32.375 144.364 32.375Z"
      stroke="#1A91FF"
      strokeWidth="1.37055"
    />
    <path
      opacity="0.3"
      d="M144.364 0.457031C223.842 0.457031 288.272 64.8864 288.272 144.364C288.272 223.842 223.842 288.272 144.364 288.272C64.8864 288.272 0.457031 223.842 0.457031 144.364C0.457122 64.8864 64.8864 0.457122 144.364 0.457031Z"
      stroke="#1A91FF"
      strokeWidth="0.913699"
    />
    <path
      d="M161.693 148.61L138.963 162.067C136.076 163.779 132.392 161.665 132.392 158.275V130.454C132.392 127.064 136.043 124.95 138.963 126.661L161.693 140.119C164.879 142.032 164.879 146.697 161.693 148.61Z"
      fill="white"
    />
    <defs>
      <filter id="filter0_d_7495_53865" x="40.9369" y="66.5204" width="206.573" height="206.573" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
        <feFlood floodOpacity="0" result="BackgroundImageFix" />
        <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
        <feOffset dy="25.5836" />
        <feGaussianBlur stdDeviation="23.7562" />
        <feComposite in2="hardAlpha" operator="out" />
        <feColorMatrix type="matrix" values="0 0 0 0 0.2 0 0 0 0 0.713726 0 0 0 0 1 0 0 0 0.5 0" />
        <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_7495_53865" />
        <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_7495_53865" result="shape" />
      </filter>
      <clipPath id="bgblur_0_7495_53865_clip_path" transform="translate(-40.9369 -66.5204)">
        <path d="M144.223 199.997C175.026 199.997 199.997 175.026 199.997 144.223C199.997 113.42 175.026 88.4492 144.223 88.4492C113.42 88.4492 88.4492 113.42 88.4492 144.223C88.4492 175.026 113.42 199.997 144.223 199.997Z" />
      </clipPath>
    </defs>
  </svg>
);

const VideoPreview = () => {
  const handleVideoClick = () => {
    // TODO: Open video modal or navigate to video page
    console.log('Video preview clicked');
  };

  return (
    <div className={s.videoPreview}>
      <div className={s.videoContainer}>
        <div className={s.videoThumbnail} onClick={handleVideoClick}>
          <div className={s.playButton}>
            <PlayButton />
          </div>
        </div>
      </div>
    </div>
  );
};

const InfoIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
    <path
      d="M10 0.25C8.07164 0.25 6.18657 0.821828 4.58319 1.89317C2.97982 2.96451 1.73013 4.48726 0.992179 6.26884C0.254225 8.05042 0.061142 10.0108 0.437348 11.9021C0.813554 13.7934 1.74215 15.5307 3.10571 16.8943C4.46928 18.2579 6.20656 19.1865 8.09787 19.5627C9.98919 19.9389 11.9496 19.7458 13.7312 19.0078C15.5127 18.2699 17.0355 17.0202 18.1068 15.4168C19.1782 13.8134 19.75 11.9284 19.75 10C19.7473 7.41498 18.7192 4.93661 16.8913 3.10872C15.0634 1.28084 12.585 0.25273 10 0.25ZM9.625 4.75C9.84751 4.75 10.065 4.81598 10.25 4.9396C10.435 5.06321 10.5792 5.23891 10.6644 5.44448C10.7495 5.65005 10.7718 5.87625 10.7284 6.09448C10.685 6.31271 10.5778 6.51316 10.4205 6.6705C10.2632 6.82783 10.0627 6.93498 9.84448 6.97838C9.62625 7.02179 9.40005 6.99951 9.19449 6.91436C8.98892 6.82922 8.81322 6.68502 8.6896 6.50002C8.56598 6.31501 8.5 6.0975 8.5 5.875C8.5 5.57663 8.61853 5.29048 8.82951 5.0795C9.04049 4.86853 9.32664 4.75 9.625 4.75ZM10.75 15.25C10.3522 15.25 9.97065 15.092 9.68934 14.8107C9.40804 14.5294 9.25 14.1478 9.25 13.75V10C9.05109 10 8.86033 9.92098 8.71967 9.78033C8.57902 9.63968 8.5 9.44891 8.5 9.25C8.5 9.05109 8.57902 8.86032 8.71967 8.71967C8.86033 8.57902 9.05109 8.5 9.25 8.5C9.64783 8.5 10.0294 8.65804 10.3107 8.93934C10.592 9.22064 10.75 9.60218 10.75 10V13.75C10.9489 13.75 11.1397 13.829 11.2803 13.9697C11.421 14.1103 11.5 14.3011 11.5 14.5C11.5 14.6989 11.421 14.8897 11.2803 15.0303C11.1397 15.171 10.9489 15.25 10.75 15.25Z"
      fill="#0A0C11"
    />
  </svg>
);

const Alert = () => {
  return (
    <div className={s.alert}>
      <div className={s.alertContent}>
        <div className={s.alertIcon}>
          <InfoIcon />
        </div>
        <div className={s.alertText}>
          <p>Your fund raising profile is private until Demo Day launch. Visibility is restricted to you and admins only.</p>
        </div>
      </div>
    </div>
  );
};
