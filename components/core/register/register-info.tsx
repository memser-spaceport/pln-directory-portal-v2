'use client';

import useStepsIndicator from '@/hooks/useStepsIndicator';

function RegisterInfo() {
  return (
    <>
      <div className="mri">
        <div className="mri__head">
          <h2 className="mri__head__title">Join the Protocol Labs Network</h2>
          <p className="mri__head__desc">Tell us about yourself</p>
        </div>
       
      </div>
      <style jsx>
        {`
          .mri {
          }
          .mri__head {
            padding: 24px;
          }
          .mri__head__title {
            font-size: 24px;
            font-weight: 600;
            color: white;
          }
          .mri__head__desc {
            color: white;
            opacity: 0.8;
            font-size: 14px;
            font-weight: 400;
            padding: 12px 0 24px 0;
            border-bottom: 1px solid #dedede;
          }
          .mri__stepsm {
            width: 100%;
            height: 60px;
            background: white;
            padding: 0 24px;
            display: flex;
            position: sticky;
            top: 0;
            
          }
          .mri__stepsd {
            display: none;
            flex-direction: column;
            gap: 24px;
            margin-top: 24px;
            padding: 0 24px;
          }
          .mri__stepsd__item {
            display: flex;
            gap: 10px;
            align-items: center;
          }
          .mri__stepsd__item__text {
            font-size: 16px;
            color: white;
            text-transform: capitalize;
          }
          .mri__stepsd__item__icon {
            position: relative;
          }
          .mri__stepsd__item__hexagon__step {
            position: absolute;
            top: 50%;
            left: 50%;
            font-size: 14px;
            font-weight: 600;
            transform: translate(-50%, -50%);
          }
          .mri__stepsd__item__icon__hexagon {
            position: relative;
            width: 24px;
            height: 13.8564px;
            background-color: #cbd5e1;
            margin: 6.9282px 0;
            display: flex;
            align-items: center;
            font-size: 14px;
            font-weight: 600;
            justify-content: center;
            color: white;
            opacity: 0.4;
          }
          .mri__stepsd__item__icon__hexagon::before,
          .mri__stepsd__item__icon__hexagon::after {
            content: '';
            position: absolute;
            width: 0;
            border-left: 12px solid transparent;
            border-right: 12px solid transparent;
          }
          .mri__stepsd__item__icon__hexagon::before {
            bottom: 100%;
            border-bottom: 6.9282px solid #cbd5e1;
          }
          .mri__stepsd__item__icon__hexagon::after {
            top: 100%;
            border-top: 6.9282px solid #cbd5e1;
          }
          .mri__stepsd__item__hexagon__step {
            color: white;
            opacity: 1 !important;
          }

          @media (min-width: 1200px) {
            .mri__stepsd {
              display: flex;
            }
            .mri__stepsm {
              display: none;
            }
          }
        `}
      </style>
    </>
  );
}

export default RegisterInfo;
