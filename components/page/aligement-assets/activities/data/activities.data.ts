import { ActivitiesData } from '../types';

export const activitiesData: ActivitiesData = {
  hero: {
    title: 'Start Collecting Points',
    description: 'Collect points by contributing verified activities across the Protocol Labs Network. Explore what\'s live below.',
    note: '',
    submitButtonLabel: 'Submit Activity',
    suggestLinkText: 'Have an idea for a new incentivized activity?',
    suggestLinkHighlight: 'Suggest one here + collect points',
    hintText: 'Click on an activity to view the full requirements'
  },
  activities: [
    // ─── Repeatable ───────────────────────────────────────────────────────────
    {
      id: 'contribute-forum-response',
      category: 'Knowledge Sharing',
      activity: 'Thoughtful Responder',
      networkValue: 'Write a thoughtful, substantive response to a forum post',
      points: '250',
      frequency: 'Repeatable',
      verificationType: 'Manual Review',
      cta: 'submit',
      popupContent: {
        title: 'Thoughtful Responder',
        overview: 'Write a thoughtful, substantive response to an existing LabOS Forum discussion that moves the conversation forward. Strong responses should meet one of the requirements below, but should generally be geared towards creating the opportunity for further and deeper responses.',
        networkBenefits: 'Sharing knowledge and experience through thoughtful forum posts, office hours, and published resources is core to the knowledge sharing that builds a stronger PL Network.',
        rules: [
          'Add meaningful insight to the post',
          'Ask a sharp follow-up question',
          'Synthesize relevant personal or professional experience',
          'Introduce useful evidence, context, or interpretation',
          'Responses will be reviewed by the PLAA Working Group before points are awarded'
        ],
        links: [
          { text: 'LabOS Forum', url: 'https://directory.plnetwork.io/forum?cid=0' }
        ]
      }
    },
    {
      id: 'quick-conversationalist',
      category: 'Knowledge Sharing',
      activity: 'Quick Conversationalist',
      networkValue: 'You were quick to respond to a forum post and kept the momentum going',
      points: '50',
      frequency: 'Repeatable',
      verificationType: 'Auto',
      cta: 'confirm',
      popupContent: {
        title: 'Quick Conversationalist',
        overview: 'You were quick to respond to a forum post. That keeps the conversation flowing and helps the LabOS forum feel more alive and dynamic.',
        networkBenefits: 'Keeps forum discussions active while the topic is timely and increases the chance that questions turn into useful exchanges.',
        rules: [
          'The qualifying response must be posted shortly after the original forum post while the discussion is still active',
          'The response must be substantive enough to keep the conversation moving'
        ],
        links: [
          { text: 'forum post', url: 'https://directory.plnetwork.io/forum?cid=0' }
        ]
      }
    },
    {
      id: 'host-office-hours',
      category: 'Knowledge Sharing',
      activity: 'Host Office Hours',
      networkValue: 'Host office hours where you share your expertise with PL Network members',
      points: '100',
      frequency: 'Repeatable',
      verificationType: 'Auto',
      cta: 'confirm',
      popupContent: {
        title: 'Host Office Hours',
        overview: 'Host live sessions to share expertise, provide feedback, or collaborate with others in the network. These real-time connections not only share knowledge, but build stronger connections. Set yourself up to host office hours via your profile page.',
        networkBenefits: 'Makes member expertise accessible and creates lightweight paths for feedback, collaboration, and mentoring across the network.',
        rules: [
          'Sessions must be scheduled through directory.plnetwork.io and only completed sessions count towards rewards',
          'Each session must run for at least 15 minutes'
        ]
      }
    },
    {
      id: 'network-introduction',
      category: 'Programs',
      activity: 'Make a Network Introduction',
      networkValue: 'Connect members or PL Network organizations',
      points: '500',
      frequency: 'Repeatable',
      verificationType: 'Submission',
      cta: 'submit',
      popupContent: {
        title: 'Make a Network Introduction',
        overview: 'Facilitate meaningful introductions between individuals or teams that may lead to collaboration or partnership.',
        networkBenefits: 'Creates new collaboration paths between members or teams that would otherwise stay disconnected.',
        rules: [
          'Must be a verified introduction between two parties with no prior contact'
        ]
      }
    },
    {
      id: 'high-value-connector',
      category: 'Programs',
      activity: 'High Value Connector',
      networkValue: 'Your introduction led to big things for the members or orgs you connected',
      points: '1000',
      frequency: 'Repeatable',
      verificationType: 'Submission',
      cta: 'submit',
      popupContent: {
        title: 'High Value Connector',
        overview: 'You not only connected people, but that connection added outsized value to the PL Network. These kinds of high-leverage introductions are why the PL Network exist and why we created the Alignment Asset.',
        networkBenefits: 'Incentivizes introductions that produce measurable outcomes such as advisors, partnerships, customers, or other network wins.',
        rules: [
          'Your connection led to a demonstrated, positive impact to the PL Network, like a new advisor, partnership, customer or other meaningful success',
          'Points are awarded based on the discretion of the PLAA WG'
        ]
      }
    },
    {
      id: 'respond-irl-gathering',
      category: 'Programs',
      activity: 'Attend an IRL Gathering',
      networkValue: 'RSVP to and attend a PL Network-related event',
      points: '100',
      frequency: 'Repeatable',
      verificationType: 'Auto',
      cta: 'confirm',
      popupContent: {
        title: 'Attend an IRL Gathering',
        overview: 'RSVP on the LabOS site to confirm your planned attendance at a PL Network-related event to help the organizers plan and strengthen the network.',
        networkBenefits: 'Improves event participation data and supports better planning for in-person network gatherings.',
        rules: [
          `Respond "I'm Going" on the relevant event page via IRL Gatherings before attending to qualify for points`,
          `Click I'm Going -> Select Event -> Role: Attendee, and ensure you are listed as an Attendee on the event page through your directory profile`,
          'Must attend to receive points'
        ],
        links: [
          { text: 'RSVP on the LabOS site', url: 'https://directory.plnetwork.io/events/irl' }
        ]
      }
    },
    {
      id: 'monthly-feedback-survey',
      category: 'Projects',
      activity: 'Complete a PLAA Survey',
      networkValue: 'Complete a survey distributed by PLAA to help us learn more about how to improve products, processes, and serve the network better',
      points: '50',
      frequency: 'Repeatable',
      verificationType: 'Auto',
      cta: 'confirm',
      popupContent: {
        title: 'Complete a PLAA Survey',
        overview: 'Complete a PLAA Survey. You can find surveys in the emails we send mid-month and on an ad hoc basis.',
        networkBenefits: 'Gives PLAA a reliable feedback signal for improving the program, products, and participant experience.',
        rules: [
          `Surveys must be completed before the end of the month in which they're sent`,
          'Bot or Spam responses may result in the forfeiture of points'
        ]
      }
    },
    {
      id: 'give-excellent-survey-feedback',
      category: 'Projects',
      activity: 'Give Excellent Survey Feedback',
      networkValue: 'You went above and beyond in giving thoughtful and actionable feedback',
      points: '100',
      frequency: 'Repeatable',
      verificationType: 'Auto',
      cta: 'confirm',
      popupContent: {
        title: 'Give Excellent Survey Feedback',
        overview: 'Your monthly survey feedback went above and beyond. The insights you provided helped identify new issues or drive real improvements to the Alignment Asset program.',
        networkBenefits: 'Rewards feedback that identifies meaningful issues or improvement opportunities, not just completed forms.',
        rules: [
          'Your feedback created meaningful impact, as determined by the PLAA working group',
          'The PLAA working group sent you an email noting that your feedback made you eligible for these extra points'
        ]
      }
    },
    {
      id: 'complete-a-survey',
      category: 'Projects',
      activity: 'Complete a Survey',
      networkValue: `Complete a PL Network member's survey to help them gather data for their organization`,
      points: '50',
      frequency: 'Repeatable',
      verificationType: 'Auto',
      cta: 'confirm',
      popupContent: {
        title: 'Complete a Survey',
        overview: 'Giving good feedback is one way we can help PL Network members improve their products, organization, research or mission. It might feel like a small thing, but data is valuable.',
        networkBenefits: 'Helps member organizations gather useful data from outside their own teams.',
        rules: [
          'You completed a PL Network member survey that was distributed by the PLAA program',
          'You are not a member of the organization that submitted the survey for distribution'
        ]
      }
    },
    {
      id: 'bring-new-members',
      category: 'Projects',
      activity: 'Refer New Alignment Asset Participants',
      networkValue: 'Help grow the Alignment Asset program by referring new participants',
      points: '200',
      frequency: 'Repeatable',
      verificationType: 'Submission',
      cta: 'submit',
      popupContent: {
        title: 'Refer New Alignment Asset Participants',
        overview: `Refer eligible participants to join the Alignment Asset program. Reach out to plaa-wg@plrs.xyz with the person you wish to invite's name and email. The working group will review and share referral instructions with you and the person you referred. This is how we grow the Alignment Asset program and the PL Network at-large.`,
        networkBenefits: 'Supports responsible growth of the Alignment Asset participant base through trusted referrals.',
        rules: [
          'The person must complete any eligibility form (if not already eligible) The person you refer must complete all required onboarding tasks with Surus and the PLAA to qualify',
          'The person must also complete at least one activity in the first 60 days after onboarding'
        ],
        links: [
          { text: 'plaa-wg@plrs.xyz', url: 'mailto:plaa-wg@plrs.xyz' }
        ]
      }
    },
    {
      id: 'rank-supportive-members',
      category: 'Brand',
      activity: 'Top the leaderboard',
      networkValue: 'Collect bonus points by finishing in the top 5 on the leaderboard in any snapshot period',
      points: '100',
      frequency: 'Repeatable',
      verificationType: 'Auto',
      cta: 'confirm',
      popupContent: {
        title: 'Top the leaderboard',
        overview: `Finishing in the top five on the leaderboard isn't just a personal flex, it's a symbol of dedication to the PL Network and your efforts to make the network stronger.`,
        networkBenefits: 'Creates an additional visible incentive for sustained contribution during each snapshot period.',
        rules: [
          'At the close of each snapshot period, the top 5 users with the highest verified point totals receive the bonus',
          'Points are awarded only after all activity for the snapshot has been reviewed, finalized, and closed'
        ]
      }
    },

    // ─── Recurring ────────────────────────────────────────────────────────────
    {
      id: 'host-x-space',
      category: 'Brand',
      activity: 'Host or Co-Host an X Space',
      networkValue: `Increase the PL Network's visibility by hosting an X Space related to the PL Network`,
      points: '500',
      frequency: 'Recurring',
      verificationType: 'Submission',
      cta: 'submit',
      popupContent: {
        title: 'Host or Co-Host an X Space',
        overview: 'Host or co-host an approved X Space that highlights innovation, collaboration, or thought leadership across the network.',
        networkBenefits: 'Brings more external visibility to PL Network projects, ideas, and contributors.',
        rules: [
          'Proposals must be submitted and approved before scheduling',
          'X Space must be hosted on the official PL X account to ensure metrics can be verified',
          'At least 50 people must attend the X Space'
        ]
      }
    },
    {
      id: 'write-blog-article',
      category: 'Knowledge Sharing',
      activity: 'Create a Blog Post for the Network',
      networkValue: 'Write a blog post for the PL Network sharing your expertise and insights',
      points: '500',
      frequency: 'Recurring',
      verificationType: 'Submission',
      cta: 'submit',
      popupContent: {
        title: 'Create a Blog Post for the Network',
        overview: 'Write a blog post about a key project, insight, or trend relevant to the Protocol Labs network. Submit an idea for approval, draft your post, and incorporate editorial feedback until it meets PL editorial standards. Only published posts are eligible for rewards and appear on protocol.ai/blog.',
        networkBenefits: 'Turns member expertise into publishable material that can educate the network and external audiences.',
        rules: [
          'You must submit an idea for approval before drafting',
          'You must be willing to incorporate up to two rounds of editorial feedback',
          'The post must be approved and published',
          '*If a post does not meet standards after two rounds of edits and is not published, no points are awarded'
        ]
      }
    },
    {
      id: 'construct-alignment-asset-case-study',
      category: 'Knowledge Sharing',
      activity: 'Write and publish a case study about the Alignment Asset',
      networkValue: 'Write a case study about your participation in the PL Network, how the Alignment Asset program drove a meaningful outcome for you or your project, and how that strengthened the network as a whole',
      points: '500',
      frequency: 'Recurring',
      verificationType: 'Submission',
      cta: 'submit',
      popupContent: {
        title: 'Write and publish a case study about the Alignment Asset',
        overview: 'Write a case study highlighting how your participation in PLAA drove meaningful outcomes for you and the Protocol Labs network. Describe the incentivized activity, your actions, and why it mattered. Focus on the real, measurable impacts. Your case study should clearly show how PLAA participation translates into measurable value for the network, not just individual contributions. Any case study that is later published in future posts or formats beyond the internal library may even collect additional points. Only approved case studies that are opted into the internal content library are eligible to receive rewards.',
        networkBenefits: 'Creates concrete evidence of how PLAA participation produces measurable value for contributors and the network.',
        rules: [
          'To submit an idea for a case study, start by proposing your case study via the activity bot',
          'You must draft your case study and work with a designated member of the PLAA Working Group to incorporate feedback until final approval',
          'After approval, you must opt in for the case study to be included in the internal content library',
          '**Only approved case studies that are opted into the internal content library are eligible to receive rewards'
        ]
      }
    },
    {
      id: 'refer-team-member',
      category: 'People/Talent',
      activity: 'Refer a Potential Team Member to a PL Network Org',
      networkValue: 'Grow the network by referring someone you know for an open position at a PL Network company or org',
      points: '100',
      frequency: 'Recurring',
      verificationType: 'Submission',
      cta: 'submit',
      popupContent: {
        title: 'Refer a Potential Team Member to a PL Network Org',
        overview: 'Refer exceptional talent to the Protocol Labs network by submitting candidates through the designated form. Check out the PL Network Job Board to see open roles: https://directory.plnetwork.io/jobs.',
        networkBenefits: 'Expands the candidate pipeline for open roles across network companies and organizations.',
        rules: [
          'The referral must be for an open role at a PL Network Member organization or company',
          'The org can only be your own organzation or company, if you are not a member of the executive or founding team',
          'The referral must at least pass the screening interview stage'
        ],
        links: [
          { text: 'https://directory.plnetwork.io/jobs', url: 'https://directory.plnetwork.io/jobs' }
        ]
      }
    },
    {
      id: 'propose-incentivized-activity',
      category: 'Programs',
      activity: 'Propose a New Activity for the PLAA',
      networkValue: 'Design an activity for PLAA that will get participants to contribute to the network',
      points: '250',
      frequency: 'Recurring',
      verificationType: 'Submission',
      cta: 'submit',
      popupContent: {
        title: 'Propose a New Activity for the PLAA',
        overview: 'Propose a new Alignment Asset activity that solves a clear network challenge or unmet need.',
        networkBenefits: 'Sources activity ideas directly from participants and validates whether they create real engagement.',
        rules: [
          'The activity must be reviewed and approved by the PLAA working group',
          'At least five participants (other than you) must complete the activity'
        ]
      }
    },
    {
      id: 'help-organize-event',
      category: 'Programs',
      activity: 'Help Organize an Event',
      networkValue: 'Host or co-host an event that delivers real value to the Protocol Labs community',
      points: '1000',
      frequency: 'Recurring',
      verificationType: 'Auto',
      cta: 'submit',
      popupContent: {
        title: 'Help Organize an Event',
        overview: 'Host or co-host a curated activity or event catered to Protocol Labs participants to aid with an array of topics, ranging from company formation, dedicated development, cross-network collaboration, etc. Events should be intentionally designed, independently run without direct PL, Inc. or Polaris, Inc. sponsorship in the form of direct compensation for time or labor, and focused on delivering real value to the Protocol Labs community.',
        networkBenefits: 'Encourages member-led events that deliver practical value without relying solely on central sponsorship.',
        rules: [
          'The event must be created and published in Luma and included on a live, discoverable calendar or listing',
          'You must add events@plrs.xyz as an Event Manager in Luma so registration and attendance data can be accessed',
          'Host must submit it to the PL events directory by adding it to https://directory.plnetwork.io/events/irl via https://irl.plnetwork.io/events/',
          'To qualify as a Host, your profile must be clearly listed under the Host section of the event',
          'At least 10 people not associated with your organization or company must attend'
        ],
        links: [
          { text: 'events@plrs.xyz', url: 'mailto:events@plrs.xyz' },
          { text: 'https://directory.plnetwork.io/events/irl', url: 'https://directory.plnetwork.io/events/irl' },
          { text: 'https://irl.plnetwork.io/events/', url: 'https://irl.plnetwork.io/events/' }
        ]
      }
    },
    {
      id: 'highlight-contribution',
      category: 'Projects',
      activity: 'Highlight an Outstanding Network Contribution',
      networkValue: 'Submit or recognize significant work by someone that advanced the network',
      points: '250',
      frequency: 'Recurring',
      verificationType: 'Submission',
      cta: 'submit',
      popupContent: {
        title: 'Highlight an Outstanding Network Contribution',
        overview: 'Nominate individuals or teams whose exceptional contributions have made a measurable, long-term impact across the Protocol Labs network — such as groundbreaking research, governance improvements, or projects that transform network operations.',
        networkBenefits: 'Surfaces important work that might otherwise be invisible and creates a channel for peer recognition.',
        rules: [
          'You cannot submit yourself or your own organization',
          'Your submission must be accepted by the PLAA working group after a quality review',
          'All submissions must contain enough detail to understand the impact on the network',
          `**If eligible, the person or team you're recognizing will receive up to 2500 PLAA pts`
        ]
      }
    },
    {
      id: 'share-ai-resource',
      category: 'Network Tooling',
      activity: 'Share an AI Resource or Tool You Built',
      networkValue: `Share a cool AI resource or tool you built on the LabOS forum that's useful to other PL Network members`,
      points: '250',
      frequency: 'Recurring',
      verificationType: 'Submission',
      cta: 'confirm',
      popupContent: {
        title: 'Share an AI Resource or Tool You Built',
        overview: 'Share a reusable AI resource that helps other network members learn from, adapt, or adopt a useful AI-enabled workflow. Eligible resources may include AI tools, automations, prompt libraries, .md guides, playbooks, templates, scripts, or examples of how AI is being used to improve team operations, product work, research, community building, or other network-relevant work. Strong posts should explain the problem the resource solves, highlight relevant use cases, and invite feedback, questions, improvements, adaptations, or examples from other members who may want to apply it in their own work.',
        networkBenefits: 'Helps teams discover reusable AI workflows, tools, templates, and examples from peers.',
        rules: [
          'You must make a forum post of at least 100 words about the tool or resource on the LabOS forum',
          'The resource must be hosted on a public Github repository',
          'The GitHub resource must include clear documentation or usage instructions'
        ]
      }
    },
    {
      id: 'contribute-alignment-program',
      category: 'Projects',
      activity: 'Contribute to the Alignment Asset Program',
      networkValue: 'Support the ongoing design and development of the experiment itself.',
      points: '250+',
      frequency: 'Recurring',
      verificationType: 'Submission',
      cta: 'submit',
      popupContent: {
        title: 'Contribute to the Alignment Asset Program',
        overview: 'Contribute documentation, analysis, or tooling improvements that support the growth and optimization of the Alignment Asset program.\n\nContributions are recognized by size: Small Contribution — 250 points (e.g., review or comment on ideas); Medium Contribution — 500 points (e.g., write documentation, analyze system efficiency, develop minor tools); Significant Contribution — 1,000 points (e.g., develop major tooling, design innovative incentive structures, implement systemic improvements).',
        networkBenefits: 'Support the ongoing design and development of the experiment itself.',
        rules: [
          'Activities that involve advising the Trust on asset management or investment decisions are ineligible'
        ]
      }
    },

    // ─── One-Time ─────────────────────────────────────────────────────────────
    {
      id: 'update-directory-profile',
      category: 'Network Tooling',
      activity: 'Setup Your PL Directory Profile',
      networkValue: 'Complete your PL Network profile, so other members can get to know you',
      points: '250',
      frequency: 'One-Time',
      verificationType: 'Auto',
      cta: 'confirm',
      popupContent: {
        title: 'Setup Your PL Directory Profile',
        overview: 'Set up your PL Directory profile with all the fields required below.',
        networkBenefits: 'Improves member discoverability and makes office hours, project contributions, and contact paths easier to find.',
        rules: [
          'You must provide your name, email, role, LinkedIn, and Telegram',
          'You must list at least one Project Contribution (i.e. name of the project and a quick summary of impact there)',
          'You must setup office hours and have a live office hours link'
        ]
      }
    },
    {
      id: 'share-compensation-data',
      category: 'People/Talent',
      activity: 'Share Compensation Data',
      networkValue: 'Share your compensation data with our talent team',
      points: '50',
      frequency: 'One-Time',
      verificationType: 'Submission',
      cta: 'submit',
      popupContent: {
        title: 'Share Compensation Data',
        overview: 'Share your compensation data to support network-wide compensation transparency, benchmarking, and pay-equity insights. Submit your information securely using the designated form. All information will be anonymized.',
        networkBenefits: 'Improves compensation benchmarking and pay-equity insight while keeping submitted information anonymized.',
        rules: [
          'You must complete the submission form',
          'You may only submit compensation data up to 2 times per year for points'
        ]
      }
    },
    {
      id: 'design-incentive-experiment',
      category: 'Network Tooling',
      activity: 'Design a Custom Incentive Experiment',
      networkValue: 'Share expertise and insights across the network.',
      points: '200+',
      frequency: 'One-Time',
      verificationType: 'Submission',
      cta: 'submit',
      popupContent: {
        title: 'Design a Custom Incentive Experiment',
        overview: 'Propose a short-term incentivized initiative—such as a research study, contributor challenge, pilot test, or community-based campaign—with clear goals, measurable outcomes, and a defined participant group.\n\nRecommended participant pool sizes: Small Initiatives (couple of hours) collect 200 points per participant, Medium Initiatives (4-10 hours) collect 600 points, and Large Initiatives (10+ hours) collect 1200 points.',
        networkBenefits: 'Share expertise and insights across the network.',
        rules: [
          'Must be reviewed and approved by AAWG before launch',
          'Include a project description, target audience, success criteria, timeline, point budget, distribution method, point validity period, and program manager'
        ]
      }
    }
  ]
};
