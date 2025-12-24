'use client';

import { useEffect, useState, useRef } from 'react';
import SupportSection from "../rounds/sections/support-section";

// Description items data
const descriptionItems = [
  'A shared rewards system that ties network-wide contributions to shared progress.',
  'An ongoing, iterative experiment to align value, collaboration, and recognition across the entire Protocol Labs ecosystem.',
  'Evolves with every version, adding new activities, mechanics, and ways to measure impact that move us closer to true collective success.',
];

// Why section data
const whyItems = [
  {
    title: "Get recognized for the work you're already doing.",
    description: 'Your contributions become visible and valued across the ecosystem.',
  },
  {
    title: 'Collect points that can convert to tokens for verified activities.',
    description: 'Turn meaningful work into measurable outcomes.',
  },
  {
    title: 'Access a wide network of collaborators and resources.',
    description: 'Connect with contributors across the ecosystem.',
  },
  {
    title: 'Help shape the future of network-wide incentives.',
    description: 'Your participation influences how value is measured and rewarded.',
  },
];

// Who section roles data
const whoRoles = [
  { role: 'Founders', description: 'driving new ventures' },
  { role: 'Researchers', description: 'advancing core protocols' },
  { role: 'Builders', description: 'shipping tools, products, and experiments' },
  { role: 'Operators', description: 'coordinating teams and projects' },
];

// Important details data
const importantDetails = [
  'Tokens are distributed based on verified contributions across the network.',
  'Each category has a fixed token allocation.',
  'All tokens are issued and managed by the trust.',
];

// How section data
const howItems = [
  {
    number: 1,
    title: 'Contribute',
    description:
      'Share knowledge, make introductions, refer talent, or support ongoing projects — every action that strengthens the ecosystem counts.',
    width: 'wide',
  },
  {
    number: 2,
    title: 'Collect',
    description:
      'Each contribution collects points tracked in monthly "snapshot periods," reflecting your ongoing engagement with the network.',
    width: 'narrow',
  },
  {
    number: 3,
    title: 'Convert',
    description:
      'Points may be converted into PLAA1 tokens issued by Surus Trust Company — providing tangible value tied to your contributions.',
    width: 'narrow',
  },
  {
    number: 4,
    title: 'Capitalize',
    description:
      'Periodic token buyback auctions allow the Trust to purchase tokens, turning collective progress into value and rewarding participants over time.',
    width: 'wide',
  },
];

const Overview = () => {
  const [showFloatingButton, setShowFloatingButton] = useState(false);
  const triggerRef = useRef<HTMLDivElement>(null);
  const secondButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    let isTriggerOutOfView = false;
    let isSecondButtonVisible = false;

    const updateFloatingButton = () => {
      // Show floating button when trigger is out of view AND second button is NOT visible
      setShowFloatingButton(isTriggerOutOfView && !isSecondButtonVisible);
    };

    const triggerObserver = new IntersectionObserver(
      ([entry]) => {
        // When the trigger element is NOT visible, mark as out of view
        isTriggerOutOfView = !entry.isIntersecting;
        updateFloatingButton();
      },
      {
        threshold: 0,
        rootMargin: '0px',
      }
    );

    const secondButtonObserver = new IntersectionObserver(
      ([entry]) => {
        // When second button is visible, hide floating button
        isSecondButtonVisible = entry.isIntersecting;
        updateFloatingButton();
      },
      {
        threshold: 0,
        rootMargin: '0px',
      }
    );

    if (triggerRef.current) {
      triggerObserver.observe(triggerRef.current);
    }

    if (secondButtonRef.current) {
      secondButtonObserver.observe(secondButtonRef.current);
    }

    return () => {
      if (triggerRef.current) {
        triggerObserver.unobserve(triggerRef.current);
      }
      if (secondButtonRef.current) {
        secondButtonObserver.unobserve(secondButtonRef.current);
      }
    };
  }, []);

  const handleAccountClick = () => {
    window.open('https://app.surus.io/create_investor_account', '_blank');
  };

  return (
    <>
      <div className="overview">
        <div className="overview__content">
          <div className="overview__content__title overview__section-title">
            <p>What if every company in the network could share in each other&apos;s success?</p>
            <span className="overview__content__title__span">That&apos;s the idea behind the PL Alignment Asset:</span>
          </div>

          <div className="overview__content__description">
            {descriptionItems.map((item, index) => (
              <div key={index} className="overview__content__description__item">
                {item}
              </div>
            ))}
          </div>

          {/* Trigger element - when this scrolls out of view, show floating button */}
          <div ref={triggerRef} className="overview__floating-trigger" />

          <button
            className="overview__content__button"
            onClick={handleAccountClick}
          >
            <img src="/icons/rounds/filecoin-white.svg" alt="account" />
            <span>Create Your Account</span>
          </button>
        </div>

        <div className="overview__content__why">
          <div className="overview__section-title">Why?</div>
          <div className="overview__content__why__description">
            {whyItems.map((item, index) => (
              <div key={index} className="overview__content__why__description__item">
                {item.title}
                <p>{item.description}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="overview__content__who">
          <div className="overview__content__who__header">
            <div className="overview__content__who__header__content">
              <div className="overview__section-title">Who?</div>
              <div className="overview__content__who__header__content__description">
                The Alignment Asset is designed for all network members across the Protocol Labs ecosystem, including:
                <ul>
                  {whoRoles.map((item, index) => (
                    <li key={index}>
                      <span className="overview__content__who__header__content__description__item">{item.role}</span>{' '}
                      {item.description}
                    </li>
                  ))}
                </ul>
                <p>
                  If your work creates value anywhere in the network, the experiment aims to capture it. Ongoing
                  iterations will help us better understand, measure, and recognize meaningful contribution.
                </p>
              </div>
            </div>
            <div className="overview__content__who__header__content__info">
              <img src="/icons/info-upt.svg" alt="Info" />
              <div>
                Currently, the PL Alignment Asset is available to Germany, Switzerland, and accredited investors in the
                US. To be notified as it becomes more widely available, please fill out this{' '}
                <a
                  href="https://forms.gle/yh5dv85X8ZsVDrZ77"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="overview__content__text__link"
                >
                  {' '}
                  form
                </a>{' '}
                to join the waitlist.
              </div>
            </div>
          </div>

          <div className="overview__content__who__details">
            <div className="overview__content__who__details__title">Important details to know</div>
            <ul className="overview__content__who__details__list">
              {importantDetails.map((detail, index) => (
                <li key={index}>{detail}</li>
              ))}
              <li><a href="#" className="overview__content__text__link">Learn more</a> about the incentive model.</li>
            </ul>
          </div>
        </div>

        <div className="overview__content__how__section">
          <div className="overview__section-title">How?</div>
          <div className="overview__content__how">
            <div className="overview__content__how__row">
              {howItems.slice(0, 2).map((item, index) => (
                <div key={index} className={`overview__content__how__item overview__content__how__item--${item.width}`}>
                  <img src="/icons/blue-shadow.svg" alt="shadow" />
                  <img src="/icons/hex-border.svg" alt="border" width={34} height={43} />
                  <span className="overview__content__how__item__number">{item.number}</span>
                  <div className="overview__content__how__item__title">{item.title}</div>
                  <div>{item.description}</div>
                </div>
              ))}
            </div>
            <div className="overview__content__how__row">
              {howItems.slice(2, 4).map((item, index) => (
                <div key={index + 2} className={`overview__content__how__item overview__content__how__item--${item.width}`}>
                  <img src="/icons/blue-shadow.svg" alt="shadow" />
                  <img src="/icons/hex-border.svg" alt="border" width={34} height={43} />
                  <span className="overview__content__how__item__number">{item.number}</span>
                  <div className="overview__content__how__item__title">{item.title}</div>
                  <div>{item.description}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="overview__content__how__learn-more-wrapper">
            <div className="overview__content__how__learn-more">
              <span className="overview__content__how__learn-more__text">Learn more:</span> Read the{' '}
              <a href="#" className="overview__content__text__link">FAQ</a> for details on contributions, points, and tokens.
            </div>
          </div>
        </div>

        <div className="overview__content__signup">
          <div className="overview__content__signup__header">
            <div className="overview__section-title">Sign Up to Join the Private Beta</div>
            <div className="overview__content__signup__header__description">
              Sign up to join the private beta and take part in this ongoing experiment. You&apos;ll contribute to
              network-wide progress, collect points for verified activities, and help refine how value is measured and
              recognized across the Protocol Labs Network.
            </div>
          </div>
          <button
            ref={secondButtonRef}
            className="overview__content__button"
            onClick={handleAccountClick}
          >
            <img src="/icons/rounds/filecoin-white.svg" alt="account" />
            <span>Create Your Account</span>
          </button>
        </div>

        <SupportSection />
      </div>

      {/* Floating Action Button */}
      <button
        className={`overview__floating-button ${showFloatingButton ? 'overview__floating-button--visible' : ''}`}
        onClick={handleAccountClick}
        aria-label="Create Your Account"
      >
        <img src="/icons/rounds/filecoin-white.svg" alt="account" />
        <span className="overview__floating-button__text">Create Your Account</span>
      </button>

      <style jsx>
        {`
          .overview {
            display: flex;
            flex-direction: column;
            gap: 120px;
            width: 100%;
          }

          .overview__content {
            display: flex;
            flex-direction: column;
            gap: 32px;
          }

          .overview__content__title {
            display: flex;
            flex-direction: column;
            gap: 8px;
          }

          .overview__section-title {
            font-weight: 600;
            font-size: 24px;
            line-height: 100%;
            color: #0f172a;
          }

          .overview__content__title__span {
            font-weight: 400;
            font-size: 16px;
            line-height: 20px;
            color: #475569;
          }

          .overview__content__description {
            display: flex;
            gap: 16px;
            font-weight: 400;
            font-size: 14px;
            line-height: 20px;
            color: #475569;
          }

          .overview__content__description__item {
            display: flex;
            align-items: center;
            flex: 1;
            // width: 394px;
            border-radius: 12px;
            padding: 24px;
            background-color: #f8fafc;
          }

          .overview__content__button {
            display: flex;
            align-items: center;
            justify-content: center;
            align-self: flex-start;
            border: 1px solid #cbd5e1;
            border-radius: 8px;
            padding: 10px 24px;
            gap: 8px;
            box-shadow: 0px 1px 1px 0px #0f172a14;
            background-color: #156ff7;
            color: #ffffff;
            cursor: pointer;
          }

          .overview__content__why {
            display: flex;
            flex-direction: column;
            gap: 16px;
          }

          .overview__content__why__description {
            display: flex;
            // flex-wrap: wrap;
            gap: 16px;
            text-align: center;
          }

          .overview__content__why__description__item {
            display: flex;
            flex-direction: column;
            flex: 1;
            // width: 280.75px;
            border-radius: 12px;
            border: 1px solid #dbeafe;
            padding: 24px;
            background-color: #ffffff;
            font-weight: 600;
            font-size: 14px;
            line-height: 20px;
            color: #475569;
          }

          .overview__content__why__description__item p {
            font-weight: 400;
          }

          .overview__content__who {
            display: flex;
            gap: 24px;
          }

          .overview__content__who__header {
            display: flex;
            flex-direction: column;
            gap: 24px;
          }

          .overview__content__who__header__content {
            display: flex;
            flex-direction: column;
            gap: 16px;
          }

          .overview__content__who__header__content__description {
            font-weight: 400;
            font-size: 14px;
            line-height: 30px;
            color: #475569;
          }

          .overview__content__who__header__content__description ul {
            margin: 16px 0;
            padding-left: 20px;
          }

          .overview__content__who__header__content__description__item {
            font-weight: 600;
          }

          .overview__content__who__header__content__description p {
            line-height: 20px;
          }

          .overview__content__who__header__content__info {
            display: flex;
            align-items: flex-start;
            gap: 8px;
            font-weight: 400;
            font-size: 14px;
            line-height: 20px;
            color: #475569;
            border-radius: 8px;
            border: 1px solid #dbeafe;
            padding: 16px;
            background-color: #f8fafc;
          }

          .overview__content__who__details {
            margin-top: 30px;
            border-radius: 16px;
            padding: 24px;
            align-self: flex-start;
            border: 1px solid transparent;
            background:
              linear-gradient(white, white) padding-box,
              linear-gradient(71.47deg, rgba(66, 125, 255, 0.5) 8.43%, rgba(68, 213, 187, 0.5) 87.45%) border-box;
          }

          .overview__content__who__details__title {
            font-size: 20px;
            line-height: 39px;
            background: linear-gradient(71.47deg, #427dff 8.43%, #44d5bb 87.45%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
          }

          .overview__content__who__details ul {
            margin-top: 8px;
            padding-left: 20px;
          }

          .overview__content__who__details__list {
            display: flex;
            flex-direction: column;
            gap: 8px;
            font-weight: 400;
            font-size: 14px;
            line-height: 20px;
            color: #475569;
          }

          .overview__content__who__details__list li:last-child::marker {
            color: #156FF7;
          }

          .overview__content__how__section {
            display: flex;
            flex-direction: column;
            gap: 16px;
          }

          .overview__content__how {
            display: flex;
            flex-direction: column;
            gap: 24px;
            margin-top: 33px;
          }

          .overview__content__how__row {
            display: flex;
            flex-wrap: wrap;
            gap: 24px;
          }

          .overview__content__how__item {
            position: relative;
            display: flex;
            flex-direction: column;
            gap: 8px;
            font-weight: 400;
            font-size: 14px;
            line-height: 22px;
            color: #475569;
            border-radius: 16px;
            padding: 30px;
            border: 1px solid transparent;
            background:
              linear-gradient(white, white) padding-box,
              linear-gradient(71.47deg, rgba(66, 125, 255, 0.5) 8.43%, rgba(68, 213, 187, 0.5) 87.45%) border-box;
            overflow: hidden;
            transition: background 0.3s ease;
          }

          .overview__content__how__item:hover {
            background:
              linear-gradient(white, white) padding-box,
              linear-gradient(71.47deg, rgba(68, 213, 187, 0.5) 8.43%, rgba(66, 125, 255, 0.5) 87.45%) border-box;
          }

          .overview__content__how__item--wide {
            flex: 1.5;
            min-width: 300px;
          }

          .overview__content__how__item--narrow {
            flex: 1;
            min-width: 300px;
          }

          .overview__content__how__item img[alt='shadow'] {
            position: absolute;
            top: 0;
            left: 0;
          }

          .overview__content__how__item img[alt='border'] {
            position: absolute;
            top: -2px;
            left: 30px;
          }

          .overview__content__how__item__number {
            position: absolute;
            top: 8px;
            left: 42px;
            font-weight: 600;
            font-size: 18px;
            color: #0f172a;
          }

          .overview__content__how__item__title {
            position: relative;
            font-weight: 600;
            font-size: 16px;
            line-height: 25px;
            color: #0f172a;
            margin-top: 23px;
          }

          .overview__content__how__learn-more-wrapper {
            width: 100%;
            margin-top: 56px;
            text-align: center;
          }

          .overview__content__how__learn-more {
            display: inline-block;
            font-weight: 600;
            font-size: 16px;
            line-height: 20px;
            color: #475569;
            text-align: center;
            border-radius: 100px;
            padding: 16px 22px;
            border: 1.5px solid transparent;
            background:
              linear-gradient(white, white) padding-box,
              linear-gradient(71.47deg, #427dff 8.43%, #44d5bb 87.45%) border-box;
          }

          .overview__content__how__learn-more__text {
            color: #0f172a;
          }

          .overview__content__text__link {
            text-decoration: underline;
            text-decoration-style: solid;
            color: #156ff7;
            cursor: pointer;
          }

          .overview__content__signup {
            display: flex;
            flex-direction: column;
            gap: 40px;
          }

          .overview__content__signup__header {
            display: flex;
            flex-direction: column;
            gap: 8px;
          }

          .overview__content__signup__header__description {
            font-weight: 400;
            font-size: 16px;
            line-height: 22px;
            color: #475569;
          }

          .overview__floating-trigger {
            position: absolute;
            top: 200px;
            height: 1px;
            width: 1px;
            pointer-events: none;
          }

          .overview__floating-button {
            position: fixed;
            bottom: 32px;
            right: 32px;
            z-index: 1;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            border: 1px solid #cbd5e1;
            border-radius: 50%;
            min-width: 48px;
            width: 48px;
            height: 48px;
            padding: 0;
            box-shadow: 0px 2.47px 7.4px 0px #0F172A29;
            background-color: #156ff7;
            color: #ffffff;
            cursor: pointer;
            overflow: hidden;
            /* Animation properties */
            opacity: 0;
            visibility: hidden;
            transform: scale(0.8) translateY(20px);
            transition: opacity 0.3s ease, visibility 0.3s ease, transform 0.3s ease, width 0.3s ease 0.1s, border-radius 0.3s ease 0.1s, padding 0.3s ease 0.1s, background-color 0.2s ease;
            white-space: nowrap;
          }

          .overview__floating-button--visible {
            opacity: 1;
            visibility: visible;
            transform: scale(1) translateY(0);
          }

          .overview__floating-button:hover {
            width: auto;
            min-width: 48px;
            border-radius: 8px;
            padding: 10px 24px;
            gap: 8px;
            background-color: #1260d9;
            box-shadow: 0px 2.47px 7.4px 0px #0F172A29;
            transition: opacity 0.3s ease, visibility 0.3s ease, transform 0.3s ease, width 0.35s ease, border-radius 0.35s ease, padding 0.35s ease, background-color 0.2s ease;
          }

          .overview__floating-button:active {
            transform: scale(0.98);
          }

          .overview__floating-button img {
            width: 20px;
            height: 20px;
            flex-shrink: 0;
          }

          .overview__floating-button__text {
            max-width: 0;
            overflow: hidden;
            opacity: 0;
            color: #ffffff;
            font-size: 14px;
            font-weight: 400;
            white-space: nowrap;
            transition: max-width 0.15s ease, opacity 0.1s ease;
          }

          .overview__floating-button:hover .overview__floating-button__text {
            max-width: 200px;
            opacity: 1;
            transition: max-width 0.35s ease 0.05s, opacity 0.3s ease 0.1s;
          }

          @media (min-width: 1024px) {
            .overview__content__how__row {
              flex-wrap: nowrap;
            }
          }

          @media (max-width: 1023px) {
            .overview__content__who, .overview__content__description, .overview__content__why__description {
              flex-wrap: wrap;
            }
          }
        `}
      </style>
    </>
  );
};

export default Overview;
