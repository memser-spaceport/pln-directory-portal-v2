'use client';

import { useState } from 'react';
import Image from 'next/image';
import SupportSection from '@/components/page/aligement-assets/rounds/sections/support-section';
import DisclaimerSection from '@/components/page/aligement-assets/rounds/sections/disclaimer-section';

export default function PrivacyPolicyPage() {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    personalData: false,
    useOfInformation: false,
    protectInformation: false,
    dataRententionPolicy: false,
    cookiesOrTrackers: false,
    discloseInformation: false,
    userRights: false,
    europeanRights: false,
    californiaRights: false,
    contactUs: false,
    policyChanges: false,
  });

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  return (
    <>
      <div className="privacy-policy">
        <div className="privacy-policy__header">
          <h1 className="privacy-policy__header__title">Privacy Policy</h1>
          <p className="privacy-policy__header__date">
            <em>Last Updated: May 8, 2025</em>
          </p>
        </div>

        {/* General Terms */}
        <div className="privacy-policy__overview">
          <p className="privacy-policy__overview__paragraph">
            Your privacy is important to us. This Privacy Policy (“policy”) describes how Polaris Labs, Inc. (“we,”
            “us”) collects, uses, shares, and stores your personal information (“Personal Data”) when you participate in
            the Network Contribution Points (“Points”) initiative. This policy may be updated from time to time.
          </p>
        </div>

        {/* Collapsible Sections Container */}
        <div className="privacy-policy__container">
          {/* What types of Personal Data may we collect? */}
          <div className="privacy-policy__container__section">
            <button
              className={`privacy-policy__container__section__button ${expandedSections.personalData ? 'privacy-policy__container__section__button--expanded' : ''}`}
              onClick={() => toggleSection('personalData')}
            >
              <span>What types of Personal Data may we collect?</span>
              <Image
                src={expandedSections.personalData ? '/icons/arrow-up.svg' : '/icons/arrow-down-light.svg'}
                alt="Toggle"
                width={14}
                height={14}
                className={`privacy-policy__chevron ${expandedSections.personalData ? 'privacy-policy__chevron--expanded' : ''}`}
              />
            </button>
            {expandedSections.personalData && (
              <div className="privacy-policy__container__section__content">
                <p className="privacy-policy__content__paragraph">
                  We may collect personally identifiable information from you, including but not limited to when you
                  visit our website(s), register for notifications from us, fill out a form, as well as in connection
                  with our activities and the Points initiative. This personally identifiable information (“Personal
                  Data”) may include:
                </p>
                <p className="privacy-policy__content__paragraph">
                  <ul className="privacy-policy__content__paragraph__list">
                    <li>Your name</li>
                    <li>Your email address</li>
                    <li>Social media username(s)</li>
                    <li>Account access information</li>
                    <li>Data related to your current employment, including job title, level, and compensation.</li>
                  </ul>
                </p>
              </div>
            )}
          </div>

          {/* What do we use your information for? */}
          <div className="privacy-policy__container__section">
            <button
              className={`privacy-policy__container__section__button ${expandedSections.useOfInformation ? 'privacy-policy__container__section__button--expanded' : ''}`}
              onClick={() => toggleSection('useOfInformation')}
            >
              <span>What do we use your information for?</span>
              <Image
                src={expandedSections.useOfInformation ? '/icons/arrow-up.svg' : '/icons/arrow-down-light.svg'}
                alt="Toggle"
                width={14}
                height={14}
                className={`privacy-policy__chevron ${expandedSections.useOfInformation ? 'privacy-policy__chevron--expanded' : ''}`}
              />
            </button>
            {expandedSections.useOfInformation && (
              <div className="privacy-policy__container__section__content">
                <p className="privacy-policy__content__paragraph">
                  We may use or process any of the Personal Data we collect from you in the following ways:
                </p>
                <p className="privacy-policy__content__paragraph">
                  <ul className="privacy-policy__content__paragraph__list">
                    <li className="privacy-policy__content__paragraph__list__item">
                      <b>Points Initiative:</b> To ensure that Points are properly administered and distributed to
                      you.{' '}
                    </li>
                    <li className="privacy-policy__content__paragraph__list__item">
                      <b>Interactive Features:</b> To allow you to participate in interactive features of the Points
                      initiative, such as leaderboards, discussion forums, nominating other users for Points, and the
                      like.
                    </li>
                    <li className="privacy-policy__content__paragraph__list__item">
                      <b>Compensation Benchmarking:</b> To create a compensation benchmarking service using anonymized
                      Personal Data you have given us with consent (by anonymized, we mean that in any compensation
                      benchmarking, personally identifying information like your name and email address will not be
                      attached to the employment and compensation data)
                    </li>
                    <li className="privacy-policy__content__paragraph__list__item">To comply with applicable laws.</li>
                  </ul>
                </p>
              </div>
            )}
          </div>

          {/* How do we protect your information? */}
          <div className="privacy-policy__container__section">
            <button
              className={`privacy-policy__container__section__button ${expandedSections.protectInformation ? 'privacy-policy__container__section__button--expanded' : ''}`}
              onClick={() => toggleSection('protectInformation')}
            >
              <span>How do we protect your information?</span>
              <Image
                src={expandedSections.protectInformation ? '/icons/arrow-up.svg' : '/icons/arrow-down-light.svg'}
                alt="Toggle"
                width={14}
                height={14}
                className={`privacy-policy__chevron ${expandedSections.protectInformation ? 'privacy-policy__chevron--expanded' : ''}`}
              />
            </button>
            {expandedSections.protectInformation && (
              <div className="privacy-policy__container__section__content">
                <p className="privacy-policy__content__paragraph">
                  In the course of handling your Personal Data, we may store and process the data in your country or
                  region, or in any other country where we or our affiliates, subsidiaries, or service providers process
                  data, some of which may have laws that offer different levels of data protection than the country in
                  which you live. Currently, we primarily use data centers in the United States.
                </p>
                <p className="privacy-policy__content__paragraph">
                  If we transfer data from the European Economic Area, the United Kingdom and/or Switzerland to other
                  countries that have not been determined by the EU Commission to have an adequate level of data
                  protection, we will use legal mechanisms including contracts to help ensure your rights and
                  protections.
                </p>
                <p className="privacy-policy__content__paragraph">
                  We take reasonable and appropriate steps to protect your Personal Data from unauthorized access, use,
                  disclosure, alteration, and destruction, which may include anonymization, encryption, adhering to the
                  principle of data minimization, and implementing other cybersecurity measures.
                </p>
              </div>
            )}
          </div>

          {/* What is our data retention policy? */}
          <div className="privacy-policy__container__section">
            <button
              className={`privacy-policy__container__section__button ${expandedSections.dataRententionPolicy ? 'privacy-policy__container__section__button--expanded' : ''}`}
              onClick={() => toggleSection('dataRententionPolicy')}
            >
              <span>What is our data retention policy?</span>
              <Image
                src={expandedSections.dataRententionPolicy ? '/icons/arrow-up.svg' : '/icons/arrow-down-light.svg'}
                alt="Toggle"
                width={14}
                height={14}
                className={`privacy-policy__chevron ${expandedSections.dataRententionPolicy ? 'privacy-policy__chevron--expanded' : ''}`}
              />
            </button>
            {expandedSections.dataRententionPolicy && (
              <div className="privacy-policy__container__section__content">
                <p className="privacy-policy__content__paragraph">
                  Data processed by us will be erased or the processing will be restricted in compliance with legal
                  regulations. Unless otherwise provided herein, we will erase data stored by us as soon as it is no
                  longer required for its intended purpose. Data will only be retained for a period beyond its intended
                  purpose if this is necessary for other business purposes or must be retained due to statutory
                  retention obligations. In these cases, processing will be restricted, and this data will not be
                  processed for any other purpose. A statutory exemption may exist, for example under tax or corporate
                  law. In certain cases, a longer retention period may be necessary, for example for the purposes of
                  preserving evidence.
                </p>
              </div>
            )}
          </div>

          {/* Do we use cookies or trackers? */}
          <div className="privacy-policy__container__section">
            <button
              className={`privacy-policy__container__section__button ${expandedSections.cookiesOrTrackers ? 'privacy-policy__container__section__button--expanded' : ''}`}
              onClick={() => toggleSection('cookiesOrTrackers')}
            >
              <span>Do we use cookies or trackers?</span>
              <Image
                src={expandedSections.cookiesOrTrackers ? '/icons/arrow-up.svg' : '/icons/arrow-down-light.svg'}
                alt="Toggle"
                width={14}
                height={14}
                className={`privacy-policy__chevron ${expandedSections.cookiesOrTrackers ? 'privacy-policy__chevron--expanded' : ''}`}
              />
            </button>
            {expandedSections.cookiesOrTrackers && (
              <div className="privacy-policy__container__section__content">
                <p className="privacy-policy__content__paragraph">
                  Currently we do not use cookies or web analytics on our websites.
                </p>
              </div>
            )}
          </div>

          {/* Do we disclose any information to outside parties? */}
          <div className="privacy-policy__container__section">
            <button
              className={`privacy-policy__container__section__button ${expandedSections.discloseInformation ? 'privacy-policy__container__section__button--expanded' : ''}`}
              onClick={() => toggleSection('discloseInformation')}
            >
              <span>Do we disclose any information to outside parties?</span>
              <Image
                src={expandedSections.discloseInformation ? '/icons/arrow-up.svg' : '/icons/arrow-down-light.svg'}
                alt="Toggle"
                width={14}
                height={14}
                className={`privacy-policy__chevron ${expandedSections.discloseInformation ? 'privacy-policy__chevron--expanded' : ''}`}
              />
            </button>
            {expandedSections.discloseInformation && (
              <div className="privacy-policy__container__section__content">
                <p className="privacy-policy__content__paragraph">
                  We may disclose your personal data with your consent or as we determine necessary to provide services
                  that you have requested. Additionally, we may disclose your data as follows:
                </p>
                <p className="privacy-policy__content__paragraph">
                  <ul className="privacy-policy__content__paragraph__list">
                    <li className="privacy-policy__content__paragraph__list__item">
                      <b>Collaborators on the Points initiative:</b> We may share your Personal Data with trusted
                      third-party partners, such as other collaborators on the Network Contribution Points project (such
                      as Protocol Labs, Inc. and Surus Trust Company, LLC).
                    </li>
                    <li className="privacy-policy__content__paragraph__list__item">
                      <b>Compensation Benchmarking:</b> We may share your Personal Data with third-party companies
                      specializing in compensation benchmarking.
                    </li>
                    <li className="privacy-policy__content__paragraph__list__item">
                      <b>Service Providers:</b> We may provide data to vendors working on our behalf for the purposes
                      described in this policy. For example, companies we’ve hired to provide customer service support,
                      communications support, and others who may be required to access data in order to perform certain
                      services.
                    </li>
                    <li className="privacy-policy__content__paragraph__list__item">
                      <b>Interactive features:</b> We may share your Personal Data with other participants in the Points
                      project to allow you to engage with interactive features of the project, such as displaying Points
                      leaderboards, nominating users for Points, verifying other users’ contributions, participating in
                      message boards, and the like.
                    </li>
                    <li className="privacy-policy__content__paragraph__list__item">
                      <b>Affiliates and Corporate Transactions:</b> We enable access to data across our subsidiaries,
                      affiliates, and related companies with whom we share common data systems and where such access
                      enables us to perform our business functions. We also may disclose data as part of a corporate
                      transaction or proceeding such as a merger, financing, acquisition, bankruptcy, dissolution, or a
                      transfer, divestiture, or sale of all or a portion of our business or assets.{' '}
                    </li>
                    <li className="privacy-policy__content__paragraph__list__item">
                      <b>Legal and Law Enforcement:</b> We will access, disclose, and preserve data when we believe
                      doing so is necessary to comply with applicable law or respond to value legal process, including
                      from law enforcement, national security or other government agencies.
                    </li>
                    <li className="privacy-policy__content__paragraph__list__item">
                      <b>Security, Safety, Protecting Rights:</b> We will disclose data if we believe it is necessary to
                      (a) protect our customers and others such as to prevent spam or attempts to commit fraud, or to
                      help prevent the loss of life or serious injury of anyone; (b) operate and maintain security of
                      our services, including to prevent or stop an attack on our systems, networks, events, or culture;
                      (c) protect the rights or property of ourselves and others, including enforcing our agreements,
                      terms, and policies.
                    </li>
                    <li className="privacy-policy__content__paragraph__list__item">We may provide de-identified information in accordance with applicable law. </li>
                  </ul>
                </p>
              </div>
            )}
          </div>

          {/* What rights may be available to me? */}
          <div className="privacy-policy__container__section">
            <button
              className={`privacy-policy__container__section__button ${expandedSections.userRights ? 'privacy-policy__container__section__button--expanded' : ''}`}
              onClick={() => toggleSection('userRights')}
            >
              <span>What rights may be available to me?</span>
              <Image
                src={expandedSections.userRights ? '/icons/arrow-up.svg' : '/icons/arrow-down-light.svg'}
                alt="Toggle"
                width={14}
                height={14}
                className={`privacy-policy__chevron ${expandedSections.userRights ? 'privacy-policy__chevron--expanded' : ''}`}
              />
            </button>
            {expandedSections.userRights && (
              <div className="privacy-policy__container__section__content">
                <p className="privacy-policy__content__paragraph">
                  You have choices you may elect regarding how we use your data. Local data protection laws may give
                  make these controls and choices enforceable as rights under the law if you are located in or are a
                  resident of that country, state, or territory.
                </p>
                <p className="privacy-policy__content__paragraph">
                  <ul className="privacy-policy__content__paragraph__list">
                    <li className="privacy-policy__content__paragraph__list__item">
                      Access, Portability, Correction, and Deletion: If you wish to access, copy, download, correct, or
                      delete the data we hold about you, you may send us a request as provided in our contact
                      information below.
                    </li>
                    <li className="privacy-policy__content__paragraph__list__item">
                      Communications Preferences. You can choose whether to receive promotional communications from us
                      by email. If you receive promotional emails from us and would like to stop, you can do so by
                      following the directions in that message or by contacting us as described in the Contact Us
                      section below. These choices will not apply to certain information communications such as
                      mandatory service communications.
                    </li>
                  </ul>
                </p>
              </div>
            )}
          </div>

          {/* European Data Protection Rights. */}
          <div className="privacy-policy__container__section">
            <button
              className={`privacy-policy__container__section__button ${expandedSections.europeanRights ? 'privacy-policy__container__section__button--expanded' : ''}`}
              onClick={() => toggleSection('europeanRights')}
            >
              <span>European Data Protection Rights.</span>
              <Image
                src={expandedSections.europeanRights ? '/icons/arrow-up.svg' : '/icons/arrow-down-light.svg'}
                alt="Toggle"
                width={14}
                height={14}
                className={`privacy-policy__chevron ${expandedSections.europeanRights ? 'privacy-policy__chevron--expanded' : ''}`}
              />
            </button>
            {expandedSections.europeanRights && (
              <div className="privacy-policy__container__section__content">
                <p className="privacy-policy__content__paragraph">
                  If the processing of personal data about you is subject to European Union data protection law, you
                  have certain rights with respect to that data:
                </p>
                <p className="privacy-policy__content__paragraph">
                  <ul className="privacy-policy__content__paragraph__list">
                    <li className="privacy-policy__content__paragraph__list__item">You can request access to and rectification or erasure of your personal data;</li>
                    <li className="privacy-policy__content__paragraph__list__item">
                      If any automated processing of your personal data is based on your consent or a contract with you,
                      you have a right to transfer or receive a copy of the personal data in a usable and portable
                      format;
                    </li>
                    <li className="privacy-policy__content__paragraph__list__item">
                      If the processing of your personal data is based on your consent, you can withdraw your consent
                      for future processing at any time;
                    </li>
                    <li className="privacy-policy__content__paragraph__list__item">
                      You can object to, or obtain a restriction of, the processing of your personal data under certain
                      circumstances; and
                    </li>
                    <li className="privacy-policy__content__paragraph__list__item">
                      For residents of France, you can send us specific instructions regarding the use of your data
                      after your death.
                    </li>
                    <li className="privacy-policy__content__paragraph__list__item">
                      To make such requests, please contact us following the instructions provided below. Please note,
                      in order to best serve you, we may require additional information about you to verify your
                      identity to accommodate your request. You also have the right to lodge a complaint with a
                      supervisory authority, but we encourage you to first contact us with your questions or concerns.
                    </li>
                  </ul>
                </p>
                <p className="privacy-policy__content__paragraph">
                  We rely on different lawful bases for collecting and processing personal data about you, for example,
                  with your consent and/or as necessary to provide the services you use, operate our business, meet our
                  contractual and legal obligations, protect the security of our systems and our customers, or fulfil
                  other legitimate interests.
                </p>
              </div>
            )}
          </div>

          {/* California Privacy Rights. */}
          <div className="privacy-policy__container__section">
            <button
              className={`privacy-policy__container__section__button ${expandedSections.californiaRights ? 'privacy-policy__container__section__button--expanded' : ''}`}
              onClick={() => toggleSection('californiaRights')}
            >
              <span>California Privacy Rights.</span>
              <Image
                src={expandedSections.californiaRights ? '/icons/arrow-up.svg' : '/icons/arrow-down-light.svg'}
                alt="Toggle"
                width={14}
                height={14}
                className={`privacy-policy__chevron ${expandedSections.californiaRights ? 'privacy-policy__chevron--expanded' : ''}`}
              />
            </button>
            {expandedSections.californiaRights && (
              <div className="privacy-policy__container__section__content">
                <p className="privacy-policy__content__paragraph">
                  If you are a California resident and the processing of your personal information is subject to the
                  California Consumer Privacy Act (CCPA), you have certain exercisable (or delegable) rights with
                  respect to that data:
                </p>
                <p className="privacy-policy__content__paragraph">
                  <ul className="privacy-policy__content__paragraph__list">
                    <li className="privacy-policy__content__paragraph__list__item">
                      At or before the time of collection, you have the right to receive notice of our practices,
                      including the categories of personal information to be collected, the purpose for which such
                      information is collected or used, whether it will be sold or shared and how long that information
                      is retained. You can find that information in this policy.
                    </li>
                    <li className="privacy-policy__content__paragraph__list__item">
                      You have the right to request we disclose what personal information we have about you. You may
                      also request additional information about our collection, use, disclosure, or sale of your
                      personal data. Much of this information is available in this policy.
                    </li>
                    <li className="privacy-policy__content__paragraph__list__item">
                      You have the right to request that we correct any inaccurate personal data about you or that we
                      delete it under certain circumstances, subject to some exceptions.
                    </li>
                    <li className="privacy-policy__content__paragraph__list__item">
                      You have the right to opt-out from any future “sales” or “sharing” of your data as those terms are
                      defined by the CCPA.
                    </li>
                    <li className="privacy-policy__content__paragraph__list__item">You have the right not to be discriminated against for exercising these rights</li>
                    <li className="privacy-policy__content__paragraph__list__item">
                      To make such requests, please contact us following the instructions provided below. Please note,
                      in order to best serve you, we may require additional information about you to verify your
                      identity to accommodate your request.
                    </li>
                  </ul>
                </p>
                <p className="privacy-policy__content__paragraph">
                  If you would like to withdraw your consent, or ask us to correct or delete your Personal Data please
                  email{' '}
                  <a href="mailto:compdata@plrs.xyz" className="privacy-policy__link">
                    compdata@plrs.xyz
                  </a>
                  . Please note that we may not be able to remove entirely anonymized data from compensation
                  benchmarking datasets.
                </p>
              </div>
            )}
          </div>

          {/* How to Contact Us */}
          <div className="privacy-policy__container__section">
            <button
              className={`privacy-policy__container__section__button ${expandedSections.contactUs ? 'privacy-policy__container__section__button--expanded' : ''}`}
              onClick={() => toggleSection('contactUs')}
            >
              <span>How to Contact Us</span>
              <Image
                src={expandedSections.contactUs ? '/icons/arrow-up.svg' : '/icons/arrow-down-light.svg'}
                alt="Toggle"
                width={14}
                height={14}
                className={`privacy-policy__chevron ${expandedSections.contactUs ? 'privacy-policy__chevron--expanded' : ''}`}
              />
            </button>
            {expandedSections.contactUs && (
              <div className="privacy-policy__container__section__content">
                <p className="privacy-policy__content__paragraph">
                  If you have a privacy concern, complaint, or request, please contact us at:{' '}
                  <a href="mailto:aa-wg@plrs.xyz" className="privacy-policy__link">
                    aa-wg@plrs.xyz
                  </a>
                  .
                </p>
              </div>
            )}
          </div>

          {/* Changes to our Privacy Policy */}
          <div className="privacy-policy__container__section">
            <button
              className={`privacy-policy__container__section__button ${expandedSections.policyChanges ? 'privacy-policy__container__section__button--expanded' : ''}`}
              onClick={() => toggleSection('policyChanges')}
            >
              <span>Changes to our Privacy Policy</span>
              <Image
                src={expandedSections.policyChanges ? '/icons/arrow-up.svg' : '/icons/arrow-down-light.svg'}
                alt="Toggle"
                width={14}
                height={14}
                className={`privacy-policy__chevron ${expandedSections.policyChanges ? 'privacy-policy__chevron--expanded' : ''}`}
              />
            </button>
            {expandedSections.policyChanges && (
              <div className="privacy-policy__container__section__content">
                <p className="privacy-policy__content__paragraph">
                  We may change this Privacy Policy at any time. We encourage you to periodically review this page for
                  the latest information on our privacy practices. If we make any changes, we will change the last
                  updated date below.
                </p>
                <p className="privacy-policy__content__paragraph">
                  Any modifications to this Privacy Policy will be effective upon our posting of the new terms and/or
                  upon implementation of the changes to the website (or as otherwise indicated at the time of posting).
                  In all cases, your continued use of the website or continued participation in the Points program after
                  the posting of any modified Privacy Policy indicates your acknowledgment of the terms of the modified
                  Privacy Policy.
                </p>
                <p className="privacy-policy__content__paragraph">
                  This document is CC-BY-SA. It was last updated March 14, 2025.
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="privacy-policy__disclaimer">
          <DisclaimerSection />
        </div>

        <div className="privacy-policy__footer">
          <SupportSection />
        </div>
      </div>

      <style jsx>{`
        .privacy-policy {
          width: 100%;
        }

        .privacy-policy__header {
          margin-bottom: 40px;
        }

        .privacy-policy__header__title {
          font-size: 16px;
          font-weight: 600;
          line-height: 40px;
          color: #000000;
        }

        .privacy-policy__header__date {
          font-size: 14px;
          line-height: 20px;
          font-weight: 500;
          color: rgba(100, 116, 139, 1);
        }

        .privacy-policy__overview {
          margin-bottom: 32px;
          font-weight: 400;
          font-size: 14px;
          line-height: 20px;
          letter-spacing: 0%;
        }

        .privacy-policy__content__paragraph__list {
          margin-left: 20px;
          line-height: 30px;
        }

        .privacy-policy__content__paragraph__list__item {
          margin-bottom: 15px;
        }

        .privacy-policy__link {
          color: #156ff7;
          text-decoration: underline;
          cursor: pointer;
        }

        .privacy-policy__container {
          background: rgba(248, 250, 252, 1);
          border-radius: 12px;
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 0;
          margin-bottom: 70px;
        }

        .privacy-policy__container__section {
          padding: 24px 0;
          border-bottom: 1px solid rgba(203, 213, 225, 1);
        }

        .privacy-policy__container__section:first-child {
          padding-top: 0;
        }

        .privacy-policy__container__section:last-child {
          border-bottom: none;
          padding-bottom: 0;
        }

        .privacy-policy__container__section__button {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: none;
          border: none;
          padding: 12px 0;
          cursor: pointer;
          font-size: 16px;
          font-weight: 600;
          line-height: 20px;
          color: rgba(22, 22, 31, 1);
          text-align: left;
          transition: color 0.2s ease;
        }

        .privacy-policy__chevron {
          transition: transform 0.3s ease;
          flex-shrink: 0;
        }

        .privacy-policy__chevron--expanded {
          transform: rotate(180deg);
        }

        .privacy-policy__container__section__content {
          padding: 16px 0 0 0;
          animation: fadeIn 0.3s ease;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .privacy-policy__overview__paragraph, .privacy-policy__content__paragraph {
          font-size: 15px;
          line-height: 24px;
          color: rgba(71, 85, 105, 1);
          margin: 0 0 16px 0;
        }

        .privacy-policy__overview__paragraph:last-child, .privacy-policy__content__paragraph:last-child {
          margin-bottom: 0;
        }

        .privacy-policy__link {
          color: #156ff7;
          text-decoration: underline;
          cursor: pointer;
        }

        .privacy-policy__disclaimer {
          margin-bottom: 100px;
        }

        @media (min-width: 1024px) {
          .privacy-policy__header__title {
            font-size: 24px;
            line-height: 48px;
          }

          .privacy-policy__container {
            padding: 32px;
          }

          .privacy-policy__container__section__button {
            font-size: 18px;
            line-height: 28px;
          }
        }
      `}</style>
    </>
  );
}
