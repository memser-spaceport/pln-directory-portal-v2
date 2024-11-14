import React from 'react';
import { render, screen } from '@testing-library/react';
import MemberSocialInfo from '@/components/page/member-info/member-social-info';
import '@testing-library/jest-dom';


describe('MemberSocialInfo', () => {
  const initialValues = {
    linkedinHandler: 'https://linkedin.com/in/johndoe',
    discordHandler: 'john#1234',
    twitterHandler: '@johndoe',
    githubHandler: 'johndoe',
    telegramHandler: 'johndoe',
    officeHours: 'https://calendly.com/johndoe',
    moreDetails: 'Some additional details',
  };

  it('should render all form fields with initial values', () => {
    render(<MemberSocialInfo initialValues={initialValues} errors={[]} />);

    expect(screen.getByLabelText(/LinkedIn/i)).toHaveValue(initialValues.linkedinHandler);
    expect(screen.getByLabelText(/Discord/i)).toHaveValue(initialValues.discordHandler);
    expect(screen.getByLabelText(/Twitter/i)).toHaveValue(initialValues.twitterHandler);
    expect(screen.getByLabelText(/GitHub/i)).toHaveValue(initialValues.githubHandler);
    expect(screen.getByLabelText(/Telegram/i)).toHaveValue(initialValues.telegramHandler);
    expect(screen.getByLabelText(/Office hours link/i)).toHaveValue(initialValues.officeHours);
    expect(screen.getByLabelText(/Did we miss something\?/i)).toHaveValue(initialValues.moreDetails);
  });

  it('should render info texts correctly', () => {
    render(<MemberSocialInfo initialValues={initialValues} errors={[]} />);

    expect(screen.getByText(/This will help us tag you with permissions to access the best Discord channels for you./i)).toBeInTheDocument();
    expect(screen.getByText(/Drop your calendar link here so others can get in touch with you at a time that is convenient./i)).toBeInTheDocument();
    expect(screen.getByText(/Let us know what else you would like to share and wish others would share to make it easier to locate and contact each other!/i)).toBeInTheDocument();
  });
});