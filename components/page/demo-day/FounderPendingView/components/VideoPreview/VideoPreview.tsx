import React from 'react';
import s from './VideoPreview.module.scss';

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
      <filter
        id="filter0_d_7495_53865"
        x="40.9369"
        y="66.5204"
        width="206.573"
        height="206.573"
        filterUnits="userSpaceOnUse"
        color-interpolation-filters="sRGB"
      >
        <feFlood floodOpacity="0" result="BackgroundImageFix" />
        <feColorMatrix
          in="SourceAlpha"
          type="matrix"
          values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
          result="hardAlpha"
        />
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

export const VideoPreview = () => {
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
