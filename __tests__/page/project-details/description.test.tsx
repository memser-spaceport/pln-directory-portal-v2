import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import Description from '@/components/page/project-details/description';
import { toast } from 'react-toastify';
import Cookies from 'js-cookie';
jest.mock('@/services/projects.service', () => ({
    updateProject: jest.fn(),
}));

jest.mock('@/analytics/project.analytics', () => ({
    useProjectAnalytics: () => ({
        onProjectDetailDescShowMoreClicked: jest.fn(),
        onProjectDetailDescEditCancelClicked: jest.fn(),
        onProjectDetailDescShowLessClicked: jest.fn(),
        onProjectDetailDescEditClicked: jest.fn(),
        onProjectDetailDescEditSaveClicked: jest.fn(),
        recordDescSave: jest.fn(),
    }),
}));

jest.mock('js-cookie', () => ({
    get: jest.fn().mockImplementation((key) => {
            if (key === 'authToken') {
              return 'mockAuthToken';
            }
            return null;
          })
}));

jest.mock('react-toastify', () => ({
    toast: {
        error: jest.fn(),
        success: jest.fn(),
    },
}));

describe('Description Component', () => {
    let props = {
        description: 'Test description',
        project: { id: 1, isDeleted: false },
        userHasEditRights: true,
        user: { id: 1 },
    };

    it('should render the description', () => {
        render(<Description {...props} />);
        expect(screen.getByText('Description')).toBeInTheDocument();
        expect(screen.getByText('Test description')).toBeInTheDocument();
    });

    it('should render the description component properly when there is no description', () => {
        delete props.description;
        delete props.project.isDeleted;
        render(<Description {...props} />);
        expect(screen.queryByText('Description')).not.toBeInTheDocument();
    });

    it('should show more content when "show more" is clicked', () => {
        props = {
            description: 'Test description',
            project: { id: 1, isDeleted: false },
            userHasEditRights: true,
            user: { id: 1 },
        };
        props.description = 'Test description'.repeat(200);
        render(<Description {...props} />);
        fireEvent.click(screen.getByText('show more'));
        expect(screen.getByText('Test description'.repeat(200))).toBeInTheDocument();
    });

    it('should show less content when "show less" is clicked', () => {
        render(<Description {...props} />);
        fireEvent.click(screen.getByText('show more'));
        fireEvent.click(screen.getByText('show less'));
        expect(screen.getByText(props.description.substring(0,347)+'...')).toBeInTheDocument();
    });

    it('should enable edit mode when "Edit" is clicked', () => {
        props.description = 'Test description';
        render(<Description {...props} />);
        fireEvent.click(screen.getByText('Edit'));
        expect(screen.getByTestId('description-editor-cancel')).toBeInTheDocument();
        expect(screen.getByText('Save')).toBeInTheDocument();
    });

    it('should cancel edit mode when "Cancel" is clicked', () => {
        props.description = 'Test description';
        render(<Description {...props} />);
        fireEvent.click(screen.getByText('Edit'));
        fireEvent.click(screen.getByTestId('description-editor-cancel'));
        expect(screen.getByText('Edit')).toBeInTheDocument();
    });

    it('should save the description when "Save" is clicked', async () => {
        const { updateProject } = require('@/services/projects.service');
        updateProject.mockResolvedValue({ status: 200 });
          (Cookies.get as jest.Mock).mockReturnValue('"authToken"');
        render(<Description {...props} />);
        fireEvent.click(screen.getByText('Edit'));
        fireEvent.change(screen.getByTitle('rich-text-editor'), { target: { value: 'Updated description' } });
        const test =screen.getByTitle('rich-text-editor');
        const val =test.getAttribute('value');
        fireEvent.click(screen.getByText('Save'));

        expect(updateProject).toHaveBeenCalled();
    });

    it('should save the description when "Save" is clicked', async () => {
        const { updateProject } = require('@/services/projects.service');
        updateProject.mockResolvedValue({ status: 201 });
          (Cookies.get as jest.Mock).mockReturnValue(null);
        render(<Description {...props} />);
        fireEvent.click(screen.getByText('Edit'));
        fireEvent.change(screen.getByTitle('rich-text-editor'), { target: { value: 'Updated description' } });
        const test =screen.getByTitle('rich-text-editor');
        const val =test.getAttribute('value');
        fireEvent.click(screen.getByText('Save'));

        expect(updateProject).toHaveBeenCalled();
    });
});