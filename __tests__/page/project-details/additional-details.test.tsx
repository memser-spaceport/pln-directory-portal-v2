import { fireEvent, render, screen, } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AdditionalDetails } from '@/components/page/project-details/additional-details';
import { read } from 'fs';
import React, { Dispatch, SetStateAction } from 'react';

describe('AdditionalDetails', () => {
  // const setStateMock: Dispatch<SetStateAction<any>> = jest.fn();
  // jest.spyOn(React, 'useState').mockImplementation(() => [true, setStateMock]);

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
  }
  );

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
  }
  );

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
  }
  );

  it('should render the AdditionalDetails component with the save button', () => {
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
    
    expect(screen.getByText('Save')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  }
  );


});
