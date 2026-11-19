describe('SHOW_EVENT_DRAWER (LAB-3216)', () => {
  const original = process.env.NEXT_PUBLIC_SHOW_EVENT_DRAWER;

  afterEach(() => {
    process.env.NEXT_PUBLIC_SHOW_EVENT_DRAWER = original;
  });

  const load = () => {
    let flag: boolean | undefined;
    jest.isolateModules(() => {
      flag = require('@/utils/event-drawer').SHOW_EVENT_DRAWER;
    });
    return flag;
  };

  it('is on only for the exact string "true"', () => {
    process.env.NEXT_PUBLIC_SHOW_EVENT_DRAWER = 'true';
    expect(load()).toBe(true);

    for (const value of ['', 'false', 'TRUE', '1']) {
      process.env.NEXT_PUBLIC_SHOW_EVENT_DRAWER = value;
      expect(load()).toBe(false);
    }

    delete process.env.NEXT_PUBLIC_SHOW_EVENT_DRAWER;
    expect(load()).toBe(false);
  });
});
