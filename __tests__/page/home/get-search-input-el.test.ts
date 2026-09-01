import { getSearchInputEl } from '@/components/page/home/TeamNews/utils/getSearchInputEl';

function container(html: string): HTMLDivElement {
  const el = document.createElement('div');
  el.innerHTML = html;
  return el;
}

describe('getSearchInputEl', () => {
  it('returns the input rendered inside the search container', () => {
    const el = container('<div><span>icon</span><input value="hello" /></div>');
    expect(getSearchInputEl(el)).toBe(el.querySelector('input'));
    expect(getSearchInputEl(el)?.value).toBe('hello');
  });

  it('returns null when there is no container ref yet', () => {
    expect(getSearchInputEl(null)).toBeNull();
  });

  it('returns null rather than undefined when the container holds no input', () => {
    expect(getSearchInputEl(container('<div>no field here</div>'))).toBeNull();
  });

  it('takes the first input when the container ever renders more than one', () => {
    const el = container('<input id="a" /><input id="b" />');
    expect(getSearchInputEl(el)?.id).toBe('a');
  });
});
