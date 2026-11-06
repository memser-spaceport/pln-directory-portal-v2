import { liveTopics } from '@/services/forum/liveTopics';

describe('liveTopics (LAB-3145)', () => {
  it('drops topics NodeBB marks deleted, however it spells the flag', () => {
    const topics = [
      { tid: 1, deleted: 0 },
      { tid: 2, deleted: 1 },
      { tid: 3 },
      { tid: 4, deleted: true },
      { tid: 5, deleted: '1' },
      { tid: 6, deleted: '0' },
      { tid: 7, deleted: false },
    ];

    expect(liveTopics(topics).map((topic) => topic.tid)).toEqual([1, 3, 6, 7]);
  });

  it('keeps NodeBB order and tolerates holes and a missing list', () => {
    expect(liveTopics<{ tid: number; deleted?: number }>([null, { tid: 9 }, undefined, { tid: 8 }])).toEqual([
      { tid: 9 },
      { tid: 8 },
    ]);
    expect(liveTopics(undefined)).toEqual([]);
    expect(liveTopics(null)).toEqual([]);
  });
});
