import { PENDING_VISIT_CHAT_KEY, VISIT_CHATS_STORAGE_KEY } from '@/components/page/husky/constants/visitChats';
import { getVisitChats } from '@/components/page/husky/utils/getVisitChats';
import { saveVisitChat } from '@/components/page/husky/utils/saveVisitChat';
import { removeVisitChat } from '@/components/page/husky/utils/removeVisitChat';
import { writeVisitChats } from '@/components/page/husky/utils/writeVisitChats';
import { getSessionStorage } from '@/components/page/husky/utils/getSessionStorage';
import { setPendingVisitChat } from '@/components/page/husky/utils/setPendingVisitChat';
import { takePendingVisitChat } from '@/components/page/husky/utils/takePendingVisitChat';

const visitChat = (threadId: string, updatedAt: string, title = threadId) => ({
  threadId,
  title,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt,
  messages: [{ question: title, answer: 'An answer.' }],
});

const storeRaw = (value: unknown) => sessionStorage.setItem(VISIT_CHATS_STORAGE_KEY, JSON.stringify(value));

beforeEach(() => {
  jest.restoreAllMocks();
  jest.useRealTimers();
  sessionStorage.clear();
});

describe('AI Search visit chats: reading', () => {
  it('lists the stored chats newest first', () => {
    storeRaw([
      visitChat('older', '2026-01-01T10:00:00.000Z'),
      visitChat('newest', '2026-01-03T10:00:00.000Z'),
      visitChat('middle', '2026-01-02T10:00:00.000Z'),
    ]);

    expect(getVisitChats().map((chat) => chat.threadId)).toEqual(['newest', 'middle', 'older']);
  });

  it('drops entries without a string thread id', () => {
    storeRaw([null, { title: 'no id' }, { threadId: 42 }, visitChat('kept', '2026-01-01T10:00:00.000Z')]);

    expect(getVisitChats().map((chat) => chat.threadId)).toEqual(['kept']);
  });

  it('returns no chats when nothing is stored, the value is not a list, or it is not JSON', () => {
    expect(getVisitChats()).toEqual([]);

    storeRaw({ threadId: 'not-a-list' });
    expect(getVisitChats()).toEqual([]);

    sessionStorage.setItem(VISIT_CHATS_STORAGE_KEY, '{broken');
    expect(getVisitChats()).toEqual([]);
  });
});

describe('AI Search visit chats: saving', () => {
  it('adds a new chat on top, titled by its first question', () => {
    storeRaw([visitChat('old', '2026-01-01T10:00:00.000Z')]);

    const wrote = saveVisitChat({
      threadId: 'new',
      messages: [{ question: '  Who builds IPFS?  ', answer: 'Teams.' }],
    });

    expect(wrote).toBe(true);
    const [first, second] = getVisitChats();
    expect(first).toMatchObject({ threadId: 'new', title: 'Who builds IPFS?' });
    expect(first.createdAt).toBe(first.updatedAt);
    expect(second.threadId).toBe('old');
  });

  it('titles a chat without a question "New chat"', () => {
    saveVisitChat({ threadId: 'blank', messages: [{ answer: 'Only an answer.' }] });

    expect(getVisitChats()[0].title).toBe('New chat');
  });

  it('writes nothing when the chat is reopened unchanged, so it does not move to the top', () => {
    const messages = [{ question: 'Who builds IPFS?', answer: 'Teams.' }];
    storeRaw([
      visitChat('top', '2026-01-02T10:00:00.000Z'),
      { ...visitChat('same', '2026-01-01T10:00:00.000Z'), messages },
    ]);
    const before = sessionStorage.getItem(VISIT_CHATS_STORAGE_KEY);

    expect(saveVisitChat({ threadId: 'same', messages: [...messages] })).toBe(false);
    expect(sessionStorage.getItem(VISIT_CHATS_STORAGE_KEY)).toBe(before);
  });

  it('moves an updated chat to the top, keeping its title and start time', () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-02-01T12:00:00.000Z'));
    storeRaw([
      visitChat('top', '2026-01-02T10:00:00.000Z'),
      visitChat('asked-again', '2026-01-01T10:00:00.000Z', 'Original title'),
    ]);

    const wrote = saveVisitChat({
      threadId: 'asked-again',
      messages: [
        { question: 'Different first question', answer: 'A.' },
        { question: 'Follow-up', answer: 'B.' },
      ],
    });

    expect(wrote).toBe(true);
    const chats = getVisitChats();
    expect(chats.map((chat) => chat.threadId)).toEqual(['asked-again', 'top']);
    expect(chats[0]).toMatchObject({
      title: 'Original title',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-02-01T12:00:00.000Z',
    });
    expect(chats[0].messages).toHaveLength(2);
  });

  it('removes one chat and keeps the others', () => {
    storeRaw([visitChat('a', '2026-01-02T10:00:00.000Z'), visitChat('b', '2026-01-01T10:00:00.000Z')]);

    removeVisitChat('a');

    expect(getVisitChats().map((chat) => chat.threadId)).toEqual(['b']);
  });

  it('keeps what is stored when the browser refuses the write', () => {
    storeRaw([visitChat('a', '2026-01-01T10:00:00.000Z')]);
    jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });

    expect(() => writeVisitChats([])).not.toThrow();
    expect(() => saveVisitChat({ threadId: 'b', messages: [{ question: 'Q', answer: 'A' }] })).not.toThrow();
    expect(getVisitChats().map((chat) => chat.threadId)).toEqual(['a']);
  });
});

describe('AI Search visit chats: opening one from another page', () => {
  it('hands the picked chat over once', () => {
    storeRaw([visitChat('a', '2026-01-01T10:00:00.000Z')]);

    setPendingVisitChat('a');

    expect(sessionStorage.getItem(PENDING_VISIT_CHAT_KEY)).toBe('a');
    expect(takePendingVisitChat()).toMatchObject({ threadId: 'a', title: 'a' });
    expect(sessionStorage.getItem(PENDING_VISIT_CHAT_KEY)).toBeNull();
    expect(takePendingVisitChat()).toBeNull();
  });

  it('returns nothing, and forgets the pick, when the picked chat is no longer stored', () => {
    setPendingVisitChat('gone');

    expect(takePendingVisitChat()).toBeNull();
    expect(sessionStorage.getItem(PENDING_VISIT_CHAT_KEY)).toBeNull();
  });
});

describe('AI Search visit chats: browser blocks site data', () => {
  beforeEach(() => {
    jest.spyOn(window, 'sessionStorage', 'get').mockImplementation(() => {
      throw new Error('SecurityError');
    });
  });

  it('has no storage, lists no chats and quietly skips writes', () => {
    expect(getSessionStorage()).toBeNull();
    expect(getVisitChats()).toEqual([]);
    expect(() => setPendingVisitChat('a')).not.toThrow();
    expect(takePendingVisitChat()).toBeNull();
    expect(saveVisitChat({ threadId: 'a', messages: [{ question: 'Q', answer: 'A' }] })).toBe(true);
  });
});
