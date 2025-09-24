/**
 * Demo Day Email Utilities
 * Handles opening email client with prepopulated content for demo day interactions
 */

export type DemoDayEmailAction = 'like' | 'connect' | 'invest';

export interface DemoDayEmailData {
  founderEmail: string;
  founderName: string;
  demotingTeamName: string;
  investorName: string;
  investorTeamName: string;
}

/**
 * Email templates for different demo day actions
 */
const EMAIL_TEMPLATES = {
  like: {
    subject: (demotingTeamName: string, investorTeamName: string) => 
      `PL F25 Demo Day Intro: ${demotingTeamName} <> ${investorTeamName}`,
    body: (data: DemoDayEmailData) => `Hi ${data.founderName},

I liked the idea that your team ${data.demotingTeamName} presented during PL F25 Demo Day.

I am interested in learning more. Please connect!

Yours truly,
${data.investorName}
${data.investorTeamName}`
  },
  connect: {
    subject: (demotingTeamName: string, investorTeamName: string) => 
      `PL F25 Demo Day Intro: ${demotingTeamName} <> ${investorTeamName}`,
    body: (data: DemoDayEmailData) => `Hi ${data.founderName},

I would like to connect with your team ${data.demotingTeamName} and explore a possible investment opportunity as requested during PL F25 Demo Day.

Please connect!

Yours truly,
${data.investorName}
${data.investorTeamName}`
  },
  invest: {
    subject: (demotingTeamName: string, investorTeamName: string) => 
      `PL F25 Demo Day Intro: ${demotingTeamName} <> ${investorTeamName}`,
    body: (data: DemoDayEmailData) => `Hi ${data.founderName},

I am interested in speaking with you about investing in your team ${data.demotingTeamName} as requested during PL F25 Demo Day.

Please connect!

Yours truly,
${data.investorName}
${data.investorTeamName}`
  }
};

/**
 * Opens the default email client with prepopulated content
 * @param action - The type of demo day action (like, connect, invest)
 * @param data - The email data including founder and investor information
 */
export const openDemoDayEmail = (action: DemoDayEmailAction, data: DemoDayEmailData): void => {
  const template = EMAIL_TEMPLATES[action];
  
  if (!template) {
    console.error(`Unknown demo day email action: ${action}`);
    return;
  }

  const subject = template.subject(data.demotingTeamName, data.investorTeamName);
  const body = template.body(data);

  // Encode the email components for URL
  const encodedTo = encodeURIComponent(data.founderEmail);
  const encodedSubject = encodeURIComponent(subject);
  const encodedBody = encodeURIComponent(body);

  // Create the mailto URL
  const mailtoUrl = `mailto:${encodedTo}?subject=${encodedSubject}&body=${encodedBody}`;

  // Open the email client
  try {
    window.location.href = mailtoUrl;
  } catch (error) {
    console.error('Failed to open email client:', error);
    // Fallback: try using window.open
    try {
      window.open(mailtoUrl, '_self');
    } catch (fallbackError) {
      console.error('Fallback email opening also failed:', fallbackError);
    }
  }
};

/**
 * Validates that all required email data is present
 * @param data - The email data to validate
 * @returns true if all required fields are present, false otherwise
 */
export const validateDemoDayEmailData = (data: Partial<DemoDayEmailData>): data is DemoDayEmailData => {
  return !!(
    data.founderEmail &&
    data.founderName &&
    data.demotingTeamName &&
    data.investorName &&
    data.investorTeamName
  );
};

/**
 * Creates a demo day email handler function
 * @param action - The type of demo day action
 * @param data - The email data
 * @returns A function that can be used as an event handler
 */
export const createDemoDayEmailHandler = (
  action: DemoDayEmailAction, 
  data: DemoDayEmailData
) => {
  return (event?: React.MouseEvent) => {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    if (!validateDemoDayEmailData(data)) {
      console.error('Invalid demo day email data:', data);
      return;
    }

    openDemoDayEmail(action, data);
  };
};
