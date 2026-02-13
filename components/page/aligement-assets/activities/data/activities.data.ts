import { ActivitiesData } from '../types';

export const activitiesData: ActivitiesData = {
  hero: {
    title: 'Start Collecting Points',
    description: 'Collect points by contributing verified activities across the Protocol Labs Network. You can now submit most activities through a single unified form for a faster, simpler process. Explore what\'s live below.',
    note: 'Please note: Activities marked with * are tracked automatically. We are working on introducing more automation in 2026.',
    submitButtonLabel: 'Submit Activity',
    suggestLinkText: 'Have an idea for a new incentivized activity?',
    suggestLinkHighlight: 'Suggest one here + collect points',
    hintText: 'Click on an activity to view the full requirements'
  },
  activities: [
    {
      id: 'host-x-space',
      category: 'Brand',
      activity: 'Host or Curate an X Space',
      networkValue: 'Increase network visibility and strengthen the collective brand.',
      points: '100+',
      popupContent: {
        title: 'Curate X Spaces',
        description: 'Host or co-host an approved X Space that highlights innovation, collaboration, or thought leadership across the network. Proposals must be submitted and approved before scheduling, and the X Space must be hosted on the official PL X account to ensure metrics can be verified.',
        submissionNoteTitle: 'Base Points Awarded:',
        submissionNote: '100 points for hosting or co-hosting an approved X Space, recognizing the effort required to plan and run the session.',
        pointsAwarded: {
          title: 'Impact Points Awarded (based on Total Listeners within 7 days of the live event)',
          description: '(Total Listeners = live listeners + replay listeners)',
          items: [
            { label: 'Tier 1 (50–99 total listeners)', value: '100 points' },
            { label: 'Tier 2 (100–199 total listeners)', value: '200 points' },
            { label: 'Tier 3 (200–299 total listeners)', value: '400 points' },
            { label: 'Tier 4 (300+ total listeners)', value: '500 points' }
          ]
        },
        additionalNote: 'Points are awarded once listener metrics are verified.'
      }
    },
    // {
    //   id: 'shared-resource',
    //   category: 'Capital',
    //   activity: 'Shared Resource or Cost-Saving Initiative',
    //   networkValue: 'Builds efficiency by pooling tools, services, or resources.',
    //   points: '500+',
    //   popupContent: {
    //     title: 'Shared Resource or Cost-Saving Initiative',
    //     description: 'Launch or join a resource-sharing or cost-saving effort that benefits multiple teams (e.g., negotiating SaaS discounts, sharing office space, co-sponsored research).',
    //     submissionNote: 'Must deliver shared savings or value beyond what one team could achieve alone. Submit via the reporting form after completing the activity.',
    //     pointsAwarded: {
    //       title: 'Points Awarded:',
    //       items: [
    //         { label: 'Base Reward', value: '500 points for executing & documenting the activity' },
    //         {
    //           label: 'Impact Bonus',
    //           value: '(based on total savings achieved):',
    //           subItems: [
    //             { label: 'Tier 1 (<9.99% savings)', value: '+300 points' },
    //             { label: 'Tier 2 (10–30% savings)', value: '+700 points' },
    //             { label: 'Tier 3 (>30% savings)', value: '+1,200 points' }
    //           ]
    //         },
    //         { label: 'Collaborators', value: 'Points are split equally among listed contributors' }
    //       ]
    //     }
    //   }
    // },
    {
      id: 'write-blog-article',
      category: 'Knowledge Sharing',
      activity: 'Write a Blog or Article',
      networkValue: 'Share expertise and insights across the network.',
      points: '200+',
      popupContent: {
        title: 'Create a Blog for the Network',
        description: 'Write a blog post about a key project, insight, or trend relevant to the Protocol Labs network. Submit an idea for approval, draft your post, and incorporate editorial feedback until it meets PL editorial standards. Only published posts are eligible for rewards and appear on protocol.ai/blog.',
        submissionLink: {
          text: 'protocol.ai/blog',
          url: 'http://protocol.ai/blog'
        },
        pointsAwarded: {
          title: 'Points Awarded (Writer & Editor):',
          items: [
            { label: 'Tier 1 (100–499 unique sessions)', value: '400 (writer) / 200 (editor) points' },
            { label: 'Tier 2 (500–999 sessions)', value: '800 (writer) / 400 (editor) points' },
            { label: 'Tier 3 (1,000–5,000 sessions)', value: '2k (writer) / 1k (editor) points' },
            { label: 'Tier 4 (5,000–9,999 sessions)', value: '4k (writer) / 2k (editor) points' }
          ]
        },
        additionalNote: 'If a post does not meet standards after two rounds of edits and is not published, no points are awarded.'
      }
    },
    {
      id: 'create-playbook',
      category: 'Knowledge Sharing',
      activity: 'Create a Playbook or Template*',
      networkValue: 'Document best practices others can easily use across the network.',
      points: '300+',
      isAutoTracked: true,
      popupContent: {
        title: 'Create a Replicable Playbook or Template',
        description: 'Create or share a reusable step-by-step playbook or Google Doc template (e.g., onboarding guides, community moderation frameworks, grant templates, etc.).',
        submissionNote: 'Must be based on proven practices and exclude confidential or personal information. Publish your playbook or template as a post on Protosphere to be eligible. Only published resources are eligible for validation. Please see this article on Offer Letters as an example.',
        links: [
          { text: 'Protosphere', url: 'https://protosphere.plnetwork.io/' },
          { text: 'Offer Letters', url: 'https://protosphere.plnetwork.io/posts/Offer-Letter-Template-(US-Employee)-cm24z0ud800dopnd769i8g6xw' }
        ],
        pointsAwarded: {
          title: 'Points Awarded:',
          items: [
            { label: 'Base Reward', value: `300 points for posting a "Playbook" or "Template" article` },
            {
              label: 'Impact Bonus',
              value: 'Participants may collect additional bonus points, on top of the base reward, if their submitted article meets various engagement thresholds (90 day window beginning with the date of publication).',
              italicValue: true,
              valueOnNewLine: true,
              subItems: [
                { label: 'Tier 1 (10-30 views of published resource)', value: '200 points' },
                { label: 'Tier 2 (31-50 views)', value: '500 points' },
                { label: 'Tier 3 (51+ views)', value: '900 points' }
              ]
            },
            // { label: 'Collaborators', value: 'Points are split equally among listed contributors' }
          ]
        }
      }
    },
    {
      id: 'host-office-hours',
      category: 'Knowledge Sharing',
      activity: 'Host Office Hours*',
      networkValue: 'Share your expertise with others in the network.',
      points: '150',
      isAutoTracked: true,
      popupContent: {
        title: 'Host Office Hours',
        description: 'Host live sessions to share expertise, provide feedback, or collaborate with others in the network. Sessions must be scheduled through directory.plnetwork.io and only completed sessions verified by requester count toward rewards.',
        links: [
          { text: 'directory.plnetwork.io', url: 'https://directory.plnetwork.io/members' }
        ],
        pointsAwarded: {
          title: 'Points Awarded:',
          items: [
            { label: '150 points per Office Hours session', value: '' }
          ]
        },
        additionalNote: 'Each session must run for at least 30 minutes.'
      }
    },
    {
      id: 'construct-alignment-asset-case-study',
      category: 'Knowledge Sharing',
      activity: 'Construct an Alignment Asset Case Study',
      networkValue: 'Write a case study highlighting how your participation in PLAA drove meaningful outcomes for you and the Protocol Labs network.',
      points: '250+',
      popupContent: {
        title: 'Construct an Alignment Asset Case Study',
        description: `Write a case study highlighting how your participation in PLAA drove meaningful outcomes for you and the Protocol Labs network. Describe the incentivized activity, your actions, and why it mattered. Focus on the real, measurable impacts. Your case study should clearly show how PLAA participation translates into measurable value for the network, not just individual contributions.

To submit an idea for a case study, start by completing this form and selecting the appropriate activity from the drop-down list. Once approved, a PLAA Working Group member will reach out via email. Draft your case study and work with the approver to incorporate feedback until final approval. After approval, you must opt in for the case study to be included in the internal content library. Any case study that is later published in future posts or formats beyond the internal library will collect additional points.

Only approved case studies that are opted into the internal content library are eligible to receive rewards. If a case study reaches the second Impact Tier, the author will collect additional points on top of the rewards from the previous tier.`,
        links: [
          { text: 'this form', url: 'https://forms.gle/zUQg2jUBYsWivk5t5' }
        ],
        pointsAwarded: {
          title: 'Points Awarded:',
          items: [
            { 
              label: 'Tier 1: Internal Case Study — 250 points', 
              description: "Recognizes an approved contribution that is documented as a case study and finalized within the internal content library, highlighting a clear outcome aligned with your organization’s goals and OKRs." 
            },
            { 
              label: 'Tier 2: Published Case Study — 500 points', 
              description: 'Awarded for an approved case study that is published in future posts across various formats beyond the internal content library, showcasing transferable insights, key learnings, and impact relevant to the broader ecosystem' 
            }
          ]
        }
      },
      
    },
    {
      id: 'update-directory-profile',
      category: 'Network Tooling',
      activity: 'Complete or Update Your PL Directory Profile*',
      networkValue: 'Make yourself discoverable and strengthen the network map.',
      points: '500+',
      isAutoTracked: true,
      popupContent: {
        title: 'Complete or Update Your PL Directory Profile',
        description: 'Complete your PL Directory profile with all required fields—name, email, role, at least one Project Contribution, LinkedIn, Telegram, and an office-hours link—to activate eligibility. Your profile must be fully complete before any points can be collected.',
        links: [
          { text: 'PL Directory', url: 'https://directory.plnetwork.io/members' }
        ],
        pointsAwarded: {
          title: 'Points Awarded:',
          items: [
            { label: 'Completed Profile', value: '200 points (one-time)' },
            { label: 'Updated Profile', value: '100 points (once per calendar year starting in 2026)' }
          ]
        }
      }
    },
    {
      id: 'design-incentive-experiment',
      category: 'Network Tooling',
      activity: 'Design a Custom Incentive Experiment',
      networkValue: 'Share expertise and insights across the network.',
      points: 'TBC',
      popupContent: {
        title: 'Design a Custom Incentive Experiment',
        description: 'Propose a short-term incentivized initiative—such as a research study, contributor challenge, pilot test, or community-based campaign—with clear goals, measurable outcomes, and a defined participant group. Must be reviewed and approved by AAWG before launch.',
        submissionNote: 'Include a project description, target audience, success criteria, timeline, point budget, distribution method, point validity period, and program manager.',
        pointsAwarded: {
          title: 'Recommended Participant Pool Sizes:',
          items: [
            { label: 'Small Initiatives (couple of hours)', value: '200 points per participant' },
            { label: 'Medium Initiative (4-10 hours)', value: '600 points' },
            { label: 'Large Initiatives (10+ hours)', value: '1200 points' }
          ]
        }
      },
    },
    {
      id: 'share-compensation-data',
      category: 'People/Talent',
      activity: 'Share Compensation Data',
      networkValue: 'Share expertise and insights across the network.',
      points: '300+',
      popupContent: {
        title: 'Contribute Your Compensation Data',
        description: 'Share your compensation data to support network-wide transparency, benchmarking, and pay-equity insights. Submit your information securely using the designated form.',
        submissionNote: 'You may update your data up to four (4) times per year when your position or employer changes.',
        pointsAwarded: {
          title: 'Points Awarded:',
          items: [
            { label: 'Initial Submission', value: '300 points (collected in the month your data is shared)' },
            { label: 'Data Updates', value: '50 points per update (up to 4 updates per calendar year)' }
          ]
        }
      }
    },
    {
      id: 'refer-team-member',
      category: 'People/Talent',
      activity: 'Refer a New Team Member or Collaborator',
      networkValue: 'Grow the network with quality people.',
      points: '25+',
      popupContent: {
        title: 'Talent Referral Program',
        description: 'Refer exceptional talent to the Protocol Labs network by submitting candidates through the designated form. Points can now be collected at multiple stages of the referral process, starting with referral submission and increasing as candidates progress through interviews and hiring. Hired based points are collected after 90 days of employment.',
        pointsAwarded: {
          title: 'Points Awarded',
          subtitle: [
            { label: 'Referral Submission', value: 'awarded once a complete, eligible referral is submitted: 25 points' }
          ],
          items: []
        },
        categories: [
          {
            title: 'Hiring Manager Screen:',
            tiers: [
              { label: 'Level 1 / Junior', points: '25 points' },
              { label: 'Level 2 / Junior', points: '50 points' },
              { label: 'Level 3 / Mid', points: '100 points' },
              { label: 'Level 4 / Senior', points: '125 points' },
              { label: 'Level 5 / Senior', points: '150 points' },
              { label: 'Level 6 / Executive', points: '200 points' },
              { label: 'Level 7 / Executive', points: '300 points' }
            ]
          },
          {
            title: 'Hire (IC and/or EE; part-time = 50% points):',
            description: '(hire-based points are collected after 90 days of employment)',
            tiers: [
              { label: 'Level 1 / Junior', points: '75 points' },
              { label: 'Level 2 / Junior', points: '150 points' },
              { label: 'Level 3 / Mid', points: '300 points' },
              { label: 'Level 4 / Senior', points: '375 points' },
              { label: 'Level 5 / Senior', points: '450 points' },
              { label: 'Level 6 / Executive', points: '600 points' },
              { label: 'Level 7 / Executive', points: '900 points' }
            ]
          }
        ]
      }
    },
    {
      id: 'propose-incentivized-activity',
      category: 'Programs',
      activity: 'Propose a New Incentivized Activity',
      networkValue: 'Design creative solutions to meet network needs through collaboration.',
      points: '150+',
      popupContent: {
        title: 'Create an Incentivized Activity:',
        subtitle: 'Solutions to High-Value Network Needs',
        description: 'Propose a new Alignment Asset activity that solves a clear network challenge or unmet need. Submissions must show:',
        requirements: [
          { label: 'Demand', value: 'A specific problem affecting multiple teams.' },
          { label: 'Network Impact', value: 'How the activity will deliver measurable value across the network.' },
          { label: 'Measurable Outcomes', value: 'Clear metrics for tracking progress and results.' },
          { label: 'Feasibility', value: 'The activity can be completed with available resources and within a reasonable timeframe.' }
        ],
        submissionNote: 'Submit your proposal through the designated form.',
        pointsAwarded: {
          title: 'Points Awarded:',
          items: [
            { label: 'Base Reward', value: '150 points for a submission that meets all criteria.' },
            { label: 'First Completed Activity Bonus', value: '200 points if the activity is completed at least once within the first 2 months after becoming active.' },
            { label: 'Approved Activity Bonus', value: 'Collect 10% of all points collected through the activity for the next 3 full snapshot periods (allocated monthly).' }
          ]
        }
      }
    },
    {
      id: 'network-introduction',
      category: 'Programs',
      activity: 'Make a Network Introduction',
      networkValue: 'Connect collaborators or organizations to unlock new partnerships.',
      points: '300+',
      // hasFormLink: true,
      popupContent: {
        title: 'Make a Network Introduction',
        description: 'Facilitate meaningful introductions between individuals or teams that may lead to collaboration, partnerships, or shared opportunities. Quality, verified introductions are prioritized.',
        submissionNote: 'Submit Network Introductions through the PL Directory Forum under the Intros tab or via the Activity Reporting Form. Points are collected once the introduction is reviewed and validated.',
        links: [
          { text: 'PL Directory Forum', url: 'https://directory.plnetwork.io/forum?cid=5' },
          { text: 'Activity Reporting Form', url: 'https://forms.gle/zUQg2jUBYsWivk5t5' }
        ],
        pointsAwarded: {
          title: 'Points Awarded:',
          items: [
            { label: 'Basic Introduction', value: '300 points for a verified introduction between two parties with no prior contact.', boldLabel: false },
            { label: 'High-Value Introduction', value: '500 points for introductions that lead to confirmed collaboration, partnership, or direct network contribution.', boldLabel: false },
            { label: 'Tiered Bonus (Optional)', value: '+300 points for every 5 successful introductions.', boldLabel: false },
            { label: 'Quality Rule', value: 'After 3 unsuccessful or unverified introductions, the account is paused until existing leads are confirmed or resolved.', boldLabel: false }
          ]
        }
      }
    },
    {
      id: 'help-organize-event',
      category: 'Programs',
      activity: 'Help Organize an Event',
      networkValue: 'Host or speak at a curated activity or event that deliver real value to the Protocol Labs community.',
      points: '50+',
      popupContent: {
        title: 'Help Organize an Event',
        description: `Host or speak at a curated activity or event catered to Protocol Labs participants to aid with an array of topics, ranging from company formation, dedicated development, cross-network collaboration, etc. Events should be intentionally designed, independently run without direct PL sponsorship in the form of direct compensation for time or labor, and focused on delivering real value to the Protocol Labs community.

For Hosts, the event must be created and published in Luma and included on a live, discoverable calendar or listing. You must add events@plrs.xyz as an Event Manager in Luma so registration and attendance data can be accessed, and the Luma "check-in" feature must be enabled to verify attendee participation. The event must also be submitted to the PL events directory by adding it to https://directory.plnetwork.io/events/irl via https://irl.plnetwork.io/events/, with your profile clearly listed under the Host section of the event.

For Speakers, eligibility is contingent on the event being submitted and validated by a Host through the process above. To receive points, your profile must be listed as a Speaker on the event page in https://directory.plnetwork.io/events/irl (I'm Going → Select Event → Role: Speaker).`,
        submissionNote: 'Points are awarded only once all prerequisites are met and attendance data can be verified.',
        links: [
          { text: 'https://directory.plnetwork.io/events/irl', url: 'https://directory.plnetwork.io/events/irl' },
          { text: 'https://irl.plnetwork.io/events/', url: 'https://irl.plnetwork.io/events/' },
          { text: 'https://directory.plnetwork.io/events/irl', url: 'https://directory.plnetwork.io/events/irl' }
        ],
        pointsAwarded: {
          title: 'Points Awarded:',
          items: [
            { label: 'Verified event with 5–10 attendees', value: '50 points' },
            { label: 'Verified event with 11–20 attendees', value: '150 points' },
            { label: 'Verified event with 21–50 attendees', value: '250 points' },
            { label: 'Verified event with 50–100 attendees', value: '500 points' },
            { label: 'Verified event with 100+ attendees', value: '1,000 points' }
          ]
        },
        categories: [
          {
            title: 'Points Distribution:',
            description: 'Point values apply uniformly across all eligible roles. Each individual may only receive points once, regardless of role.',
            tiers: []
          }
        ]
      }
    },
    {
      id: 'monthly-feedback-survey',
      category: 'Projects',
      activity: 'Complete the Monthly Feedback Survey or Promote Your Own Survey',
      networkValue: 'Provide insights that help refine the experiment or promote your own survey. Please look for an email for this month\'s survey link.',
      points: '100+',
      popupContent: {
        title: 'Survey Completion',
        description: 'Complete PLAA surveys at the end of each snapshot period to share feedback and help shape program evolution. Survey links are emailed mid-snapshot and must be completed by the stated deadline.',
        pointsAwarded: {
          title: 'Points Awarded:',
          items: [
            { label: 'Base Reward', value: '100 points for completing all required questions within a 14-day window.' },
            {
              label: 'Feedback Impact Bonus',
              value: '',
              subItems: [
                { label: 'Moderate Change (small adjustment to program or resources)', value: '+500 points' },
                { label: 'Major Change (significant program improvement)', value: '+2,000 points' }
              ]
            }
          ]
        }
      }
    },
    {
      id: 'highlight-contribution',
      category: 'Projects',
      activity: 'Highlight an Outstanding Network Contribution',
      networkValue: 'Submit or recognize significant work that advanced the network.',
      points: '250+',
      popupContent: {
        title: 'Distinguished Network Contributions',
        description: 'Nominate individuals or teams whose exceptional contributions have made a measurable, long-term impact across the Protocol Labs network — such as groundbreaking research, governance improvements, or projects that transform network operations.',
        submissionNote: 'Submissions must be reviewed and verified by the AAWG. After 3 unsuccessful or unverified submissions, accounts may be temporarily paused.',
        pointsAwarded: {
          title: 'Points Awarded (Impact Tiers):',
          items: [
            { label: 'Trailblazer', value: '250 points — for key initiatives or improvements that drive meaningful momentum.' },
            { label: 'Architect', value: '1,000 points — for innovative solutions or major strategic moves with clear, network-wide impact.' },
            { label: 'Visionary', value: '4,000 points — for contributions that redefine the network and drive large-scale transformation.' }
          ]
        }
      }
    },
    {
      id: 'contribute-alignment-program',
      category: 'Projects',
      activity: 'Contribute to the Alignment Asset Program',
      networkValue: 'Support the ongoing design and development of the experiment itself.',
      points: '250+',
      popupContent: {
        title: 'Alignment Asset Program Contributions',
        description: 'Contribute documentation, analysis, or tooling improvements that support the growth and optimization of the Alignment Asset program.',
        submissionNote: 'Activities that involve advising the Trust on asset management or investment decisions are ineligible.',
        pointsAwarded: {
          title: 'Points Awarded:',
          items: [
            { label: 'Small Contribution', value: '250 points (e.g., review or comment on ideas)' },
            { label: 'Medium Contribution', value: '500 points (e.g., write documentation, analyze system efficiency, develop minor tools)' },
            { label: 'Significant Contribution', value: '1,000 points (e.g., develop major tooling, design innovative incentive structures, implement systemic improvements)' }
          ]
        }
      }
    },
    {
      id: 'bring-new-members',
      category: 'Projects',
      activity: 'Bring New Members into the Alignment Asset',
      networkValue: 'Help grow the experiment by referring new members.',
      points: '200+',
      popupContent: {
        title: 'Referral Program',
        description: 'Refer eligible participants to join the Alignment Asset program. Referrals must come from the existing PL Directory member list and must successfully pass KYC + accreditation to be point-eligible.',
        links: [
          { text: 'PL Directory', url: 'https://directory.plnetwork.io/members' }
        ],
        pointsAwarded: {
          title: 'Points Awarded:',
          items: [
            { label: 'Onboarding Award', value: '200 points when your referral completes onboarding (passes KYC + accreditation).' },
            { label: 'Referral Activity Bonus', value: '750 points when your referral completes onboarding and 1 activity. Bonus may be collected in addition to the onboarding award.' }
          ]
        }
      }
    }
  ]
};


