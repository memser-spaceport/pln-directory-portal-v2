import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AdditionalDetails } from '@/components/page/project-details/additional-details';
import { read } from 'fs';
import React, { Dispatch, SetStateAction } from 'react';
import { updateProject } from '@/services/projects.service';

describe('AdditionalDetails', () => {
  // const setStateMock: Dispatch<SetStateAction<any>> = jest.fn();
  // jest.spyOn(React, 'useState').mockImplementation(() => [true, setStateMock]);

  beforeEach(() => {
    jest.resetModules();
  });

  // Mock the updateProject function
  jest.mock('@/services/projects.service', () => {
    return {
      updateProject: jest.fn().mockResolvedValue({ status: 200 }),
    };
  });

  it('should render the AdditionalDetails component', () => {
    const project = {}; // Replace {} with your project object
    const userHasEditRights = true; // Replace true with your userHasEditRights value
    const authToken = 'your-auth-token'; // Replace 'your-auth-token' with your authToken value
    const user = {}; // Replace {} with your user object

    render(<AdditionalDetails project={project} userHasEditRights={userHasEditRights} authToken={authToken} user={user} />);
    expect(screen.getByText('Additional Details')).toBeInTheDocument();
  });

  it('should render the AdditionalDetails component with the edit button', () => {
    const project = {
      isDeleted: false,
      readMe: 'This is a sample readme',
    };
    const userHasEditRights = true;
    const authToken = 'your-auth-token';
    const user = {};
    // Mock the ChildComponent
    jest.mock('md-editor-rt', () => {
      return {
        MdPreview: jest.fn(() => <div>Mocked MdEditor Component</div>),
      };
    });
    render(<AdditionalDetails project={project} userHasEditRights={userHasEditRights} authToken={authToken} user={user} />);
    expect(screen.getByText('Edit')).toBeInTheDocument();
  });

  it('should render the AdditionalDetails component without the edit button', () => {
    const project = {
      isDeleted: false,
      readMe: 'This is a sample readme',
    };
    //changed the user rights to false
    const userHasEditRights = false;
    const authToken = 'your-auth-token';
    const user = {};
    // Mock the ChildComponent
    jest.mock('md-editor-rt', () => {
      return {
        MdPreview: jest.fn(() => <div>Mocked MdEditor Component</div>),
      };
    });
    render(<AdditionalDetails project={project} userHasEditRights={userHasEditRights} authToken={authToken} user={user} />);
    expect(screen.queryByText('Edit')).not.toBeInTheDocument();
  });

  it('should render the AdditionalDetails component without the edit button when isDeeleted is true', () => {
    const project = {
      isDeleted: true,
      readMe: 'This is a sample readme',
    };
    const userHasEditRights = true;
    const authToken = 'your-auth-token';
    const user = {};
    // Mock the ChildComponent
    jest.mock('md-editor-rt', () => {
      return {
        MdPreview: jest.fn(() => <div>Mocked MdEditor Component</div>),
      };
    });
    render(<AdditionalDetails project={project} userHasEditRights={userHasEditRights} authToken={authToken} user={user} />);
    expect(screen.queryByText('Edit')).not.toBeInTheDocument();
  });

  it('should render the AdditionalDetails component without the edit button when no readme is given', () => {
    const project = {
      isDeleted: false,
    };
    const userHasEditRights = true;
    const authToken = 'your-auth-token';
    const user = {};
    // Mock the ChildComponent
    jest.mock('md-editor-rt', () => {
      return {
        MdPreview: jest.fn(() => <div>Mocked MdEditor Component</div>),
      };
    });
    render(<AdditionalDetails project={project} userHasEditRights={userHasEditRights} authToken={authToken} user={user} />);
    expect(screen.queryByText('Edit')).not.toBeInTheDocument();
  });

  it('should render the AdditionalDetails component with the save and cancel button', () => {
    const project = {
      isDeleted: false,
      readMe: 'This is a sample readme',
    };
    const userHasEditRights = true;
    const authToken = 'your-auth-token';
    const user = {};
    // Mock the ChildComponent
    jest.mock('md-editor-rt', () => {
      return {
        MdEditor: jest.fn(() => <div>Mocked MdEditor Component</div>),
      };
    });

    render(<AdditionalDetails project={project} userHasEditRights={userHasEditRights} authToken={authToken} user={user} />);
    const button = screen.getByText('Edit');
    fireEvent.click(button);

    expect(screen.queryByText('Edit')).not.toBeInTheDocument();
    expect(screen.getByText('Save')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });

  it('should trigger cancel button action', () => {
    const project = {
      isDeleted: false,
      readMe: 'This is a sample readme',
    };
    const userHasEditRights = true;
    const authToken  = 'your-auth-token';
    const user = {};

    // Mock the ChildComponent
    jest.mock('md-editor-rt', () => {
      return {
        MdEditor: jest.fn(() => <div>Mocked MdEditor Component</div>),
      };
    });

    render(<AdditionalDetails project={project} userHasEditRights={userHasEditRights} authToken={authToken} user={user} />);
    const button = screen.getByText('Edit');
    fireEvent.click(button);
    expect(screen.queryByText('Edit')).not.toBeInTheDocument();
    const cancelButton = screen.getByText('Cancel');
    
    fireEvent.click(cancelButton);
    expect(screen.queryByText('Save')).not.toBeInTheDocument();
    expect(screen.queryByText('Cancel')).not.toBeInTheDocument();
  }
  );
  it('should trigger save button action', async () => {
    const project = {
      isDeleted: false,
      readMe: 'This is a sample readme',
    };
    const userHasEditRights = true;
    const authToken  = 'your-auth-token';
    const user = {};

    // Mock the ChildComponent
    jest.mock('md-editor-rt', () => {
      return {
        MdEditor: jest.fn(() => <div>Mocked MdEditor Component</div>),
      };
    });

    render(<AdditionalDetails project={project} userHasEditRights={userHasEditRights} authToken={authToken} user={user} />);
    const button = screen.getByText('Edit');
    fireEvent.click(button);
    expect(screen.queryByText('Edit')).not.toBeInTheDocument();
    const saveButton = screen.getByText('Save');
    
    fireEvent.click(saveButton);
    await waitFor(() => {
      expect(screen.queryByText('Save')).not.toBeInTheDocument();
      expect(screen.queryByText('Cancel')).not.toBeInTheDocument();
      // expect(screen.queryByText('Additional Details updated successfully.')).toBeInTheDocument();
    });
  }
  );

  it('should have Click here when the user is the team lead', async () => {
    const userInfo = {
      leadingTeams: ['team1', 'team2'],
    };
    const project = {
      maintainingTeam: {
        uid: 'team1',
      },
    };
    const userHasEditRights = true;
    const authToken
      = 'your-auth-token';
    const user = userInfo;
    render(<AdditionalDetails project={project} userHasEditRights={userHasEditRights} authToken={authToken} user={user} />);
    expect(screen.queryByText('No additional details added.')).toBeInTheDocument();
    expect(screen.queryByText('Click Here')).toBeInTheDocument();
  });


  it('should not have Click here when the user is not the team lead', async () => {
    const userInfo = {
      leadingTeams: ['team1', 'team2'],
    };
    const project = {
      maintainingTeam: {
        uid: 'team3',
      },
    };
    const userHasEditRights = true;
    const authToken
      = 'your-auth-token';
    const user = userInfo;
    render(<AdditionalDetails project={project} userHasEditRights={userHasEditRights} authToken={authToken} user={user} />);
    expect(screen.queryByText('No additional details added.')).toBeInTheDocument();
    expect(screen.queryByText('Click Here')).not.toBeInTheDocument();
  });

  it('should return false when there is exception while validating if the user is team lead or not', async () => {
    const userInfo = {
      leadingTeams: {},
    };
    const project = {
      maintainingTeam: [],
    };
    const userHasEditRights = true;
    const authToken
      = 'your-auth-token';
    const user = userInfo;
    render(<AdditionalDetails project={project} userHasEditRights={userHasEditRights} authToken={authToken} user={user} />);
    expect(screen.queryByText('No additional details added.')).toBeInTheDocument();
    expect(screen.queryByText('Click Here')).not.toBeInTheDocument();
 
  });
 
});

