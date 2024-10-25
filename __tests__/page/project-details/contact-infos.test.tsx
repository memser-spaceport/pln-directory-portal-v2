import ContactInfos from '@/components/page/project-details/contact-infos';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

describe('ContactInfos', () => {
    const email = 'example@example.com';
    it('should render the title correctly', () => {
        render(<ContactInfos contactEmail={email} />);
        expect(screen.getByText('Contact Info')).toBeInTheDocument();
    });

    it('should render the email correctly', () => {
        render(<ContactInfos contactEmail={email} />);
        //since tooltip is used, email is rendered twice for both mobile and web version
        expect(screen.getAllByText(email)).toHaveLength(2);
    });

    it('should handle an empty email correctly', () => {
        render(<ContactInfos contactEmail={''} />);
        expect(screen.queryByText('example@example.com')).toBeNull();
    });
});
