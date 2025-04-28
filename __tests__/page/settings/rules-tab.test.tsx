import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import RulesTab from '../../../components/page/settings/intro-rules/rules-tab';
import { Rule, Topic, Tag } from '../../../types/intro-rules';

const rules: Rule[] = [
  {
    id: '1',
    topic: { id: '1', name: 'Protocol Labs' },
    tags: [
      { id: '1', name: 'Network' },
      { id: '2', name: 'Blockchain' },
      { id: '3', name: 'Web3' },
      { id: '4', name: 'Storage' },
      { id: '5', name: 'Extra' },
    ],
    leads: [
      { id: '1', name: 'Alice', avatar: '/avatar1.png', role: 'Lead' },
      { id: '2', name: 'Bob', avatar: '/avatar2.png', role: 'Lead' },
    ],
  },
];
const topics: Topic[] = [
  { id: '1', name: 'Protocol Labs' },
  { id: '2', name: 'Filecoin' },
];
const tags: Tag[] = [
  { id: '1', name: 'Network' },
  { id: '2', name: 'Blockchain' },
  { id: '3', name: 'Web3' },
  { id: '4', name: 'Storage' },
  { id: '5', name: 'Extra' },
];
const members = [
  { id: '1', name: 'Alice', avatar: '/avatar1.png', role: 'Lead' },
  { id: '2', name: 'Bob', avatar: '/avatar2.png', role: 'Lead' },
];

describe('RulesTab', () => {
  beforeEach(() => {
    // Remove any event listeners between tests
    document.body.innerHTML = '';
  });

  it('renders rules and their tags', () => {
    render(
      <RulesTab
        rules={rules}
        topics={topics}
        tags={tags}
        members={members}
      />
    );
    expect(screen.getByText('Protocol Labs')).toBeInTheDocument();
    expect(screen.getByText('2 Leads')).toBeInTheDocument();
    // Only first 4 tags are shown, then "+N"
    expect(screen.getByText('Network')).toBeInTheDocument();
    expect(screen.getByText('Blockchain')).toBeInTheDocument();
    expect(screen.getByText('Web3')).toBeInTheDocument();
    expect(screen.getByText('Storage')).toBeInTheDocument();
    expect(screen.getByText('+1')).toBeInTheDocument();
  });

  it('renders "Add New Rule" button', () => {
    const { container } = render(
      <RulesTab
        rules={rules}
        topics={topics}
        tags={tags}
        members={members}
      />
    );
    const addBtn = container.querySelector('.rules__add-btn');
  expect(addBtn).toBeInTheDocument();
  expect(addBtn).toHaveTextContent('Add New Rule');
  });

  it('dispatches add-edit-rule-modal event when "Add New Rule" is clicked', async () => {
    const eventListener = jest.fn();
    document.addEventListener('add-edit-rule-modal', eventListener);

    const { container } = render(
      <RulesTab
        rules={rules}
        topics={topics}
        tags={tags}
        members={members}
      />
    );
    const addBtn = container.querySelector('.rules__add-btn');
    if (addBtn) {
      fireEvent.click(addBtn!);
    }
    expect(eventListener).toHaveBeenCalled();
    const event = eventListener.mock.calls[0][0];
    expect(event.detail.mode).toBe('add');
  });

  it('dispatches add-edit-rule-modal event with rule when "Edit" is clicked', () => {
    const eventListener = jest.fn();
    document.addEventListener('add-edit-rule-modal', eventListener);

    render(
      <RulesTab
        rules={rules}
        topics={topics}
        tags={tags}
        members={members}
      />
    );
    fireEvent.click(screen.getByText('Edit'));
    expect(eventListener).toHaveBeenCalled();
    const event = eventListener.mock.calls[0][0];
    expect(event.detail.mode).toBe('edit');
    expect(event.detail.rule).toBeDefined();
    expect(event.detail.rule.id).toBe('1');
  });

  it('renders "No leads assigned" if no leads', () => {
    const rulesNoLeads = [
      {
        ...rules[0],
        leads: [],
      },
    ];
    render(
      <RulesTab
        rules={rulesNoLeads}
        topics={topics}
        tags={tags}
        members={members}
      />
    );
    expect(screen.getByText('No leads assigned')).toBeInTheDocument();
  });

  it('renders nothing if no rules', () => {
    render(
      <RulesTab
        rules={[]}
        topics={topics}
        tags={tags}
        members={members}
      />
    );
    expect(screen.queryByText('Protocol Labs')).not.toBeInTheDocument();
  });
});
