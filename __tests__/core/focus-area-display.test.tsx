// focus-area-display.test.tsx
import { render, screen } from '@testing-library/react';
import FocusAreaDisplay from '@/components/core/focus-area-display';
import '@testing-library/jest-dom';
import { IFocusArea } from '@/types/shared.types';
import React from 'react';

describe('FocusAreaDisplay Component', () => {
  const rawData = [
    {
      uid: '1',
      title: 'Parent 1',
      parentUid: '',
      description: 'Parent 1 description',
      createdAt: '2021-08-01T00:00:00.000Z',
      updatedAt: '2021-08-01T00:00:00.000Z',
      children: [
        {
          uid: '1-1',
          title: 'DeFi',
          children: [],
          description: '',
          parentUid: '1',
          teamAncestorFocusAreas: [],
          projectAncestorFocusAreas: [],
          createdAt: '2021-08-01T00:00:00.000Z',
          updatedAt: '2021-08-01T00:00:00.000Z',
        },
      ],
    },
    {
      uid: '2',
      title: 'Parent 2',
      parentUid: '',
      description: 'Parent 2 description',
      children: [
        {
          uid: '2-1',
          title: 'Blockchain Protocols',
          children: [],
          parentUid: '2',
          teamAncestorFocusAreas: [],
          projectAncestorFocusAreas: [],
          createdAt: '2021-08-01T00:00:00.000Z',
          updatedAt: '2021-08-01T00:00:00.000Z',
        },
        {
          uid: '2-2',
          title: 'Neurotech',
          children: [],
          parentUid: '2',
          teamAncestorFocusAreas: [],
          projectAncestorFocusAreas: [],
          createdAt: '2021-08-01T00:00:00.000Z',
          updatedAt: '2021-08-01T00:00:00.000Z',
        },
      ],
    },
  ];

  const selectedItems = [
    {
      uid: '1',
      title: 'Parent 1',
    },
    {
      uid: '2-1',
      title: 'Blockchain Protocols',
    },
    {
      uid: '2-2',
      title: 'Neurotech',
    },
  ];

  const defaultProps = {
    selectedItems: selectedItems as IFocusArea[],
    rawData: rawData as any[],
  };

  it('renders without crashing', () => {
    render(<FocusAreaDisplay {...defaultProps} />);
    expect(screen.getByText('Blockchain Protocols')).toBeInTheDocument();
  });

  it('displays selected child correctly', () => {
    render(<FocusAreaDisplay {...defaultProps} />);
    expect(screen.getByText('Parent 1')).toBeInTheDocument();
    expect(screen.getByText('Parent 2')).toBeInTheDocument();
  });

});
