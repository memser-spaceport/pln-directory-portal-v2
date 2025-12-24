'use client';

import { useState } from 'react';
import Image from 'next/image';
import SupportSection from '@/components/page/aligement-assets/rounds/sections/support-section';
import DisclaimerSection from '@/components/page/aligement-assets/rounds/sections/disclaimer-section';
import { DISCLOSURE_URL } from '@/constants/plaa';

export default function TermsOfUsePage() {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    networkContributionPoints: false,
    platformAccess: false,
    contentStandards: false,
    intellectualProperty: false,
    betaFeatures: false,
    additionalTerms: false,
  });

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  return (
    <>
      <div className="terms-of-use">
        <div className="terms-of-use__header">
          <h1 className="terms-of-use__header__title">Terms of Use</h1>
          <p className="terms-of-use__header__date">
            <em>Last Updated: May 8, 2025</em>
          </p>
        </div>

        {/* General Terms */}
        <div className="terms-of-use__overview">
          <p className="terms-of-use__overview__paragraph">
            The following terms and conditions govern your access to and use of the Network Contribution Points program,
            any PL Alignment Asset Hub dashboards, websites, webforms, tools, and documents, and all content, services,
            tools and products available at or through the PL Alignment Asset Hub dashboards, websites, webforms, tools,
            and documents (collectively, the “Platform”). Please read these terms carefully. If you don’t agree to all
            of these terms and conditions (“Terms”) without modification, you may not use or access the Platform.
          </p>
          <p className="terms-of-use__content__paragraph">
            Polaris Labs, Inc. (“we,” “our,” “us,” or “Polaris”) may make changes to these Terms from time to time. If
            you do not agree to these revisions, you may stop using the Platform.
          </p>
          <p className="terms-of-use__content__paragraph">
            You also agree that you have complied, and will continue to comply with all applicable laws including U.S.
            and E.U. sanctions laws when using the Platform. In order to use the Platform or participate in the Program
            (defined below), you must be 18 years of age or older.
          </p>
        </div>

        {/* Collapsible Sections Container */}
        <div className="terms-of-use__container">
          {/* Network Contribution Points Program Section */}
          <div className="terms-of-use__container__section">
            <button
              className={`terms-of-use__container__section__button ${expandedSections.networkContributionPoints ? 'terms-of-use__container__section__button--expanded' : ''}`}
              onClick={() => toggleSection('networkContributionPoints')}
            >
              <span>Network Contribution Points Program</span>
              <Image
                src={expandedSections.networkContributionPoints ? '/icons/arrow-up.svg' : '/icons/arrow-down-light.svg'}
                alt="Toggle"
                width={14}
                height={14}
                className={`terms-of-use__chevron ${expandedSections.networkContributionPoints ? 'terms-of-use__chevron--expanded' : ''}`}
              />
            </button>
            {expandedSections.networkContributionPoints && (
              <div className="terms-of-use__container__section__content">
                <p className="terms-of-use__content__paragraph">
                  The Network Contribution Points program (the “Program”) is an experimental program to explore
                  value-sharing and incentives mechanisms to align a network of companies and individuals.
                </p>
                <p className="terms-of-use__content__paragraph">
                  The Program is not a competition, and any points you collect through the Program (“Points”) are
                  non-transferrable, have no independent value, and cannot be redeemed for value. Additionally, we
                  reserve the right to change the number and weight of the Points you collect through the Program,
                  including, for example, rounding down on the number of Points you have received or reallocating Points
                  amongst Program participants based on their contributions, even after you have collected those Points,
                  to ensure proper and effective administration of the Points. More details are available in our{' '}
                  <a href="/alignment-assets/faqs" className="terms-of-use__link">
                    FAQs
                  </a>
                  .
                </p>
                <p className="terms-of-use__content__paragraph">
                  Third parties such as the PLAA1 Trust and the Surus Trust Company have full discretion on whether to
                  issue you any securities or other forms of value based on network activity, and you are solely
                  responsible for any expenses or tax consequences as a result of these third parties’ decisions to
                  issue these forms of value according to their terms and conditions. Polaris may provide these parties
                  information about your network activity.
                </p>
                <p className="terms-of-use__content__paragraph">
                  Some activities that Program participants may collect Points for include user submissions. We retain
                  full discretion on whether to approve any user submissions, and Points may not be awarded for user
                  submissions that are not approved. Additionally, we reserve the right to withhold Points if we
                  determine in our discretion that you have not provided sufficient evidence to show you completed an
                  activity.
                </p>
                <p className="terms-of-use__content__paragraph">
                  While we will make an effort to communicate important updates, the Program is an experimental,
                  iterative program that we may evolve over time with or without notice to you. We may discontinue
                  running the Program or providing the Platform at any time, and
                  <b> there is no guarantee that your participation in the Program will result in any reward.</b>
                </p>
                <p className="terms-of-use__content__paragraph">
                  Any Points offered via the Program are provided “AS IS,” without any offer of warranty or guarantee,
                  either express or implied (including quality, merchantability, and fitness for a particular purpose).
                  In order to participate in the Program, you agree that you have reviewed and agree with the disclaimer
                  linked here:{' '}
                  <a
                    href={DISCLOSURE_URL}
                    className="terms-of-use__link"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    PL Alignment Asset Disclosure
                  </a>
                </p>
                <p className="terms-of-use__content__paragraph">
                  You agree and represent that all information you submit via the Platform is true and accurate. We
                  reserve the right, but not the obligation, to refuse, disable, or revoke your access to the Platform
                  if we reasonably believe you are using the Platform in a fraudulent or misleading manner, such as by
                  impersonating another individual or providing false information in an an attempt to receive additional
                  Network Contribution Points through the Program.
                </p>
                <p className="terms-of-use__content__paragraph">
                  If you are on any U.S. or E.U. sanctions list, or residing in any U.S. or E.U.-sanctioned region, you
                  may not use the Platform and will not be eligible for any Points or other reward. You agree not to use
                  any technologies (such as VPNs) to obscure your location or identity for the purpose of accessing the
                  Platform or entering into the Program in violation of any U.S. or E.U. sanctions policy. Any such use
                  constitutes a violation of these Terms and may result in the immediate suspension or termination of
                  your account.
                </p>
              </div>
            )}
          </div>

          {/* Platform Access and Account Security */}
          <div className="terms-of-use__container__section">
            <button
              className={`terms-of-use__container__section__button ${expandedSections.platformAccess ? 'terms-of-use__container__section__button--expanded' : ''}`}
              onClick={() => toggleSection('platformAccess')}
            >
              <span>Platform Access and Account Security</span>
              <Image
                src={expandedSections.platformAccess ? '/icons/arrow-up.svg' : '/icons/arrow-down-light.svg'}
                alt="Toggle"
                width={14}
                height={14}
                className={`terms-of-use__chevron ${expandedSections.platformAccess ? 'terms-of-use__chevron--expanded' : ''}`}
              />
            </button>
            {expandedSections.platformAccess && (
              <div className="terms-of-use__container__section__content">
                <p className="terms-of-use__content__paragraph">
                  To access the Platform, you may be asked to provide registration details or other information to
                  create an account. You agree that you will provide us with correct, current, and complete information
                  in creating your account and in accessing the Platform. If we find that you have provided us with
                  false information we may restrict your access to the Platform or withdraw you from the Program, and
                  will not have any obligation to compensate you if this occurs.
                </p>
                <p className="terms-of-use__content__paragraph">
                  Additionally, you may only create one account unless you have received our prior written permission.
                  If you believe you have created multiple counts in error, please contact us at the email address
                  listed at the end of this policy. We may immediately suspend or restrict access to the Platform if we
                  reasonably believe that you have created multiple accounts in an attempt to abuse the Platform or to
                  collect additional Points.
                </p>
                <p className="terms-of-use__content__paragraph">
                  You agree that you will keep your account login information confidential, and will not disclose such
                  login credentials to any other person or entity. Additionally, you agree you will not provide any
                  other person with access to the Platform using your account login credentials.
                </p>
              </div>
            )}
          </div>

          {/* Content Standards */}
          <div className="terms-of-use__container__section">
            <button
              className={`terms-of-use__container__section__button ${expandedSections.contentStandards ? 'terms-of-use__container__section__button--expanded' : ''}`}
              onClick={() => toggleSection('contentStandards')}
            >
              <span>Content Standards</span>
              <Image
                src={expandedSections.contentStandards ? '/icons/arrow-up.svg' : '/icons/arrow-down-light.svg'}
                alt="Toggle"
                width={14}
                height={14}
                className={`terms-of-use__chevron ${expandedSections.contentStandards ? 'terms-of-use__chevron--expanded' : ''}`}
              />
            </button>
            {expandedSections.contentStandards && (
              <div className="terms-of-use__container__section__content">
                <p className="terms-of-use__content__paragraph">
                  The Platform may contain message boards, webforms, forums, leaderboards, and other interactive
                  features that allow users to post, submit, publish, display, or transmit data or information to
                  others. If you use the Platform to upload any data or information, you are entirely responsible for
                  all data you send or cause to be sent through the Platform (“Content”) - and you’re also responsible
                  for any harm resulting from that Content.
                </p>
                <p className="terms-of-use__content__paragraph">
                  For your own protection and the protection of the network & community, you agree to follow applicable
                  federal, state, local, and international laws in using the Platform and further agree you will not
                  post, upload, or cause to be uploaded any Content related to:
                </p>
                <p className="terms-of-use__content__paragraph">
                  <ul className="terms-of-use__content__paragraph__list">
                    <li className="terms-of-use__content__paragraph__list__item">
                      <span>
                        <b>Scams and Spam </b>- Don’t use the Platform for fraudulent, deceptive, or harmful purposes
                        like
                      </span>
                      <ul className="terms-of-use__content__paragraph__list">
                        <li>
                          Tricking or misleading users, such as by providing false information, or by impersonating
                          other people or companies.
                        </li>
                        <li>Posting or distributing spam.</li>
                      </ul>
                    </li>
                    <li className="terms-of-use__content__paragraph__list__item">
                      <span>
                        <b>Gaming the System </b>- Don’t provide false information, create multiple accounts,
                        reverse-engineer anything on the Platform, or harass other users for the purpose of collecting
                        additional Network Contribution Points via the Program.
                      </span>
                    </li>
                    <li className="terms-of-use__content__paragraph__list__item">
                      <span>
                        <b>Infringing Others’ Rights </b> - Don’t use the Platform in a way that violates the rights of
                        others, such as:
                      </span>
                      <ul className="terms-of-use__content__paragraph__list">
                        <li>Copyright, patent, trademark or trade secret rights.</li>
                        <li>Third-party licenses.</li>
                        <li>Privacy and publicity rights.</li>
                      </ul>
                    </li>
                    <li className="terms-of-use__content__paragraph__list__item">
                      <span><b>Other Harmful and Unlawful Purposes </b> - Don’t use the Platform to :</span>
                      <ul className="terms-of-use__content__paragraph__list">
                        <li>Promote or solicit unlawful services or unlawful obscene material.</li>
                        <li>
                          Promote or distribute child sexual abuse material or content encouraging or inciting
                          terrorism.
                        </li>
                        <li>
                          Act in a way that’s reasonably likely to cause or increase the risk of harm to any person(s)
                          or group(s).
                        </li>
                      </ul>
                    </li>
                  </ul>
                </p>
                <p className="terms-of-use__content__paragraph">
                  You represent and warrant that you own or have the right to submit any Content you post, upload, or
                  cause to be uploaded via the Platform, and take full responsibility for that Content, including its
                  legality, reliability, accuracy, and appropriateness. We are not responsible or liable to any
                  third-party for any Content you post, upload, or cause to be uploaded to the Platform.
                </p>
                <p className="terms-of-use__content__paragraph">
                  We have the right (but not the obligation) to, in our sole discretion, (i) refuse, remove, or disable
                  any Content, (ii) temporarily or permanently suspend access to the Platform, (iii) take appropriate
                  legal action or assist a third party who seeks to take legal action against you based on a violation
                  of these Content Standards, if we determine you’ve breached them in any way. We will not have any
                  obligation to compensate you if this occurs.
                </p>
              </div>
            )}
          </div>

          {/* Intellectual Property */}
          <div className="terms-of-use__container__section">
            <button
              className={`terms-of-use__container__section__button ${expandedSections.intellectualProperty ? 'terms-of-use__container__section__button--expanded' : ''}`}
              onClick={() => toggleSection('intellectualProperty')}
            >
              <span>Intellectual Property</span>
              <Image
                src={expandedSections.intellectualProperty ? '/icons/arrow-up.svg' : '/icons/arrow-down-light.svg'}
                alt="Toggle"
                width={14}
                height={14}
                className={`terms-of-use__chevron ${expandedSections.intellectualProperty ? 'terms-of-use__chevron--expanded' : ''}`}
              />
            </button>
            {expandedSections.intellectualProperty && (
              <div className="terms-of-use__container__section__content">
                <p className="terms-of-use__content__paragraph">
                  To the extent you provide us with any ideas, suggestions, or other feedback regarding the Program or
                  the Platform (“Feedback”), you agree to release to us all rights, titles, and interests (such as
                  intellectual property rights) in and to that Feedback. You further agree that any such Feedback may be
                  made available under the MIT/Apache 2.0 dual open source license.
                </p>
                <p className="terms-of-use__content__paragraph">
                  Our company name, the terms POLARIS and ALIGNMENT ASSET, our logo, and all related names, logos,
                  product and service names, designs, and slogans are trademarks of Polaris Labs, Inc. and/or its
                  affiliates or licensors. You agree not to use such marks other than in a way that constitutes
                  nominative use (by using a mark to refer to the trademarked entity, product, or service) without our
                  prior written permission. All other names, logos, product and services, designs, and slogans within
                  the Platform are the trademarks of their respective owners.
                </p>
              </div>
            )}
          </div>

          {/* Beta Features Terms */}
          <div className="terms-of-use__container__section">
            <button
              className={`terms-of-use__container__section__button ${expandedSections.betaFeatures ? 'terms-of-use__container__section__button--expanded' : ''}`}
              onClick={() => toggleSection('betaFeatures')}
            >
              <span>Beta Features Terms</span>
              <Image
                src={expandedSections.betaFeatures ? '/icons/arrow-up.svg' : '/icons/arrow-down-light.svg'}
                alt="Toggle"
                width={14}
                height={14}
                className={`terms-of-use__chevron ${expandedSections.betaFeatures ? 'terms-of-use__chevron--expanded' : ''}`}
              />
            </button>
            {expandedSections.betaFeatures && (
              <div className="terms-of-use__container__section__content">
                <p className="terms-of-use__content__paragraph">
                  We may release certain features described by us as “beta”, “pilot”, “limited availability”, “invite
                  only”, or “pre release” (“Beta Features”). You understand that Beta Features are still in development,
                  may have bugs or errors, may be incomplete, and may be subject to material change. You further
                  understand that the Beta Features may be generally available in some countries while still classified
                  as Beta Features in others. Despite any other provision of these Terms to the contrary, you understand
                  and agree that your use of or reliance on the Beta Features is subject to these Beta Features Terms,
                  which will continue in force until we remove the classification of those features as Beta Features in
                  writing.
                </p>
                <p className="terms-of-use__content__paragraph">
                  We have no obligation to provide any bug fixes, error corrections, patches, service packs, revisions,
                  successors, or updated versions to, Beta Features, or any part of them. However, if we provide or make
                  available any update to Beta Features (“Beta Update”), you must fully implement the Beta Update within
                  the time period we specify, or 30 days after we make the Beta Update available, whichever is sooner.
                </p>
                <p className="terms-of-use__content__paragraph">
                  We may make updates, changes, repairs, or conduct maintenance at any time, and with or without notice,
                  which may result in changes in the availability or quality of the Beta Features. In addition, we may
                  suspend your access to the Beta Features with or without notice, including if we reasonably believe
                  that (a) suspending the Beta Features is required by applicable laws; (b) continuing to provide the
                  Beta Features would place us in breach of any obligation we owe to a third party; or (c) we determine
                  in our sole discretion that continuing to provide the Beta Features would give rise to an unacceptable
                  security or privacy risk. We may also terminate your access to the Beta Features if, in our sole
                  discretion, we stop offering the Beta Features completely or in your jurisdiction.
                </p>
              </div>
            )}
          </div>

          {/* Additional Terms */}
          <div className="terms-of-use__container__section">
            <button
              className={`terms-of-use__container__section__button ${expandedSections.additionalTerms ? 'terms-of-use__container__section__button--expanded' : ''}`}
              onClick={() => toggleSection('additionalTerms')}
            >
              <span>Additional Terms</span>
              <Image
                src={expandedSections.additionalTerms ? '/icons/arrow-up.svg' : '/icons/arrow-down-light.svg'}
                alt="Toggle"
                width={14}
                height={14}
                className={`terms-of-use__chevron ${expandedSections.additionalTerms ? 'terms-of-use__chevron--expanded' : ''}`}
              />
            </button>
            {expandedSections.additionalTerms && (
              <div className="terms-of-use__container__section__content">
                <p className="terms-of-use__content__paragraph">
                  The content we post on the Platform is made available for general information purposes, and we do not
                  warrant that it is accurate or complete. We disclaim any liability and responsibility for any reliance
                  you place on such information.
                </p>
                <p className="terms-of-use__content__paragraph">
                  You may have access to third-party websites and webpages through the Platform, and you take full
                  responsibility for your use of those third-party sites, which fall outside our scope and control.
                </p>
                <p className="terms-of-use__content__paragraph">
                  The Platform is provided “AS IS,” without any offer of warranty or guarantee, either express or
                  implied (including quality, merchantability and fitness for a particular purpose). We will not be
                  liable if for any reason all or any part of the Platform is unavailable at any time.
                </p>
                <p className="terms-of-use__content__paragraph">
                  TO THE MAXIMUM EXTENT PERMITTED BY LAW (A) YOU ASSUME ALL LIABILITY FOR ANY DAMAGES, CLAIMS, EXPENSES
                  OR OTHER COSTS (INCLUDING, WITHOUT LIMITATION, ATTORNEYS’ FEES) YOU SUFFER OR INCUR AS A RESULT OF
                  THIRD-PARTY CLAIMS RELATING TO YOUR USE OF THE PLATFORM OR YOUR PARTICIPATION IN THE PROGRAM, (B) YOU
                  ASSUME ALL LIABILITY FOR ANY INDIRECT, SPECIAL, INCIDENTAL, PUNITIVE OR CONSEQUENTIAL DAMAGES, AND (C)
                  YOUR MAXIMUM AGGREGATE DAMAGES ARISING OUT OF OR IN CONNECTION WITH THE PLATFORM SHALL BE LIMITED TO
                  $100, REGARDLESS OF THE CAUSE.
                </p>
                <p className="terms-of-use__content__paragraph">
                  All matters relating to the Platform, the Program, and these Terms shall be governed by and construed
                  in accordance with the laws of the State of Delaware without giving effect to any choice or conflict
                  of law provision.
                </p>
                <p className="terms-of-use__content__paragraph">
                  These Terms and our Privacy Policy are the sole and entire agreement between you and us with respect
                  to the Platform and the Program, and supersede any related agreements or discussions.
                </p>
                <p className="terms-of-use__content__paragraph">
                  If you have any questions, comments, concerns, or feedback regarding these Terms or about the Platform
                  or Program, you may contact us at{' '}
                  <a href="mailto:aa-wg@plrs.xyz" className="terms-of-use__link" target="_blank" rel="noopener noreferrer">
                    aa-wg@plrs.xyz
                  </a>
                  .
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Disclaimer Box */}
        <div className="terms-of-use__disclaimer">
          <DisclaimerSection />
        </div>

        {/* Footer/Contact Information */}
        <div className="terms-of-use__footer">
          <SupportSection />
        </div>
      </div>

      <style jsx>{`
        .terms-of-use {
          width: 100%;
        }

        .terms-of-use__header {
          margin-bottom: 40px;
        }

        .terms-of-use__header__title {
          font-size: 16px;
          font-weight: 600;
          line-height: 40px;
          color: #000000;
        }

        .terms-of-use__header__date {
          font-size: 14px;
          line-height: 20px;
          font-weight: 500;
          color: rgba(100, 116, 139, 1);
        }

        .terms-of-use__overview {
          margin-bottom: 32px;
          font-weight: 400;
          font-size: 14px;
          line-height: 20px;
          letter-spacing: 0%;
        }

        .terms-of-use__container {
          background: rgba(248, 250, 252, 1);
          border-radius: 12px;
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 0;
          margin-bottom: 70px;
        }

        .terms-of-use__container__section {
          padding: 24px 0;
          border-bottom: 1px solid rgba(203, 213, 225, 1);
        }

        .terms-of-use__container__section:first-child {
          padding-top: 0;
        }

        .terms-of-use__container__section:last-child {
          border-bottom: none;
          padding-bottom: 0;
        }

        .terms-of-use__content__paragraph__list {
          margin-left: 20px;
          line-height: 28px;
        }

        .terms-of-use__content__paragraph__list__item {
          margin-bottom: 15px;
        }

        .terms-of-use__container__section__button {
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

        .terms-of-use__chevron {
          transition: transform 0.3s ease;
          flex-shrink: 0;
        }

        .terms-of-use__chevron--expanded {
          transform: rotate(180deg);
        }

        .terms-of-use__container__section__content {
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

        .terms-of-use__overview__paragraph, .terms-of-use__content__paragraph {
          font-size: 15px;
          line-height: 24px;
          color: rgba(71, 85, 105, 1);
          margin: 0 0 16px 0;
        }

        .terms-of-use__overview__paragraph:last-child, .terms-of-use__content__paragraph:last-child {
          margin-bottom: 0;
        }

        .terms-of-use__link {
          color: #156ff7;
          text-decoration: underline;
          cursor: pointer;
        }

        .terms-of-use__disclaimer {
          margin-bottom: 100px;
        }

        @media (min-width: 1024px) {
          .terms-of-use__header__title {
            font-size: 24px;
            line-height: 48px;
          }

          .terms-of-use__container {
            padding: 32px;
          }

          .terms-of-use__container__section__button {
            font-size: 18px;
            line-height: 28px;
          }
        }
      `}</style>
    </>
  );
}
