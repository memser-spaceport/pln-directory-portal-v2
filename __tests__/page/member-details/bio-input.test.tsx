import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';
import { FormProvider, useForm } from 'react-hook-form';

import { BioInput } from '@/components/page/member-details/BioDetails/components/BioInput';

jest.mock('next/dynamic', () => () => {
  const MockEditor = ({
    value,
    onChange,
    placeholder,
  }: {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
  }) => (
    <textarea
      aria-label="Mock Bio Editor"
      value={value || ''}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
    />
  );
  MockEditor.displayName = 'MockEditor';
  return MockEditor;
});

jest.mock('@/services/members/hooks/useGenerateBioWithAi', () => ({
  useGenerateBioWithAi: jest.fn(() => ({ mutateAsync: jest.fn(), isPending: false, reset: jest.fn() })),
}));

function TestForm({
  fieldName,
  label,
  showGenerateWithAiButton,
  placeholder,
}: {
  fieldName?: string;
  label?: string;
  showGenerateWithAiButton?: boolean;
  placeholder?: string;
}) {
  const methods = useForm({ defaultValues: { bio: 'Default bio', teamBio: 'Team bio' } });

  return (
    <FormProvider {...methods}>
      <BioInput
        name={fieldName}
        label={label}
        showGenerateWithAiButton={showGenerateWithAiButton}
        placeholder={placeholder}
      />
      <div data-testid="bio-value">{methods.watch('bio')}</div>
      <div data-testid="team-bio-value">{methods.watch('teamBio')}</div>
    </FormProvider>
  );
}

describe('BioInput', () => {
  it('uses bio as the default field name', () => {
    render(<TestForm />);

    fireEvent.change(screen.getByLabelText('Mock Bio Editor'), { target: { value: 'Updated default bio' } });

    expect(screen.getByTestId('bio-value')).toHaveTextContent('Updated default bio');
    expect(screen.getByTestId('team-bio-value')).toHaveTextContent('Team bio');
  });

  it('updates a custom field name when provided', () => {
    render(<TestForm fieldName="teamBio" />);

    fireEvent.change(screen.getByLabelText('Mock Bio Editor'), { target: { value: 'Updated team bio' } });

    expect(screen.getByTestId('bio-value')).toHaveTextContent('Default bio');
    expect(screen.getByTestId('team-bio-value')).toHaveTextContent('Updated team bio');
  });

  it('renders a custom label when provided', () => {
    render(<TestForm label="About" />);

    expect(screen.getByText('About')).toBeInTheDocument();
    expect(screen.queryByText('Bio')).not.toBeInTheDocument();
  });

  it('hides the generate with AI button when configured', () => {
    render(<TestForm showGenerateWithAiButton={false} />);

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('renders a custom placeholder when provided', () => {
    render(<TestForm placeholder="Add team background" />);

    expect(screen.getByPlaceholderText('Add team background')).toBeInTheDocument();
  });
});