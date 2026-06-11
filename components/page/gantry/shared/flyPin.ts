const PIN_PATH =
  'M14.6 3.4a1.1 1.1 0 0 1 1.55 0l4.45 4.45a1.1 1.1 0 0 1 0 1.55l-.4.4a3 3 0 0 1-3 .75l-2.2-.66-3.05 3.05a3 3 0 0 1 .15.85 3 3 0 0 1-.9 2.15l-.55.55a1 1 0 0 1-1.4 0L5.9 14.2l-3.1 3.1a1 1 0 0 1-1.5-1.32l.08-.1 3.1-3.1-1.9-1.9a1 1 0 0 1 0-1.42l.55-.55a3 3 0 0 1 2.15-.9q.43 0 .85.15l3.05-3.05-.66-2.2a3 3 0 0 1 .75-3z';

export function flyPin(fromEl: Element | null, toEl: Element | null, onFinish?: () => void): void {
  if (!fromEl || !toEl) {
    onFinish?.();
    return;
  }

  const from = fromEl.getBoundingClientRect();
  const to = toEl.getBoundingClientRect();

  const el = document.createElement('div');
  el.setAttribute(
    'style',
    'position:fixed;z-index:9999;width:26px;height:26px;border-radius:8px;' +
      'background:linear-gradient(71.47deg,#427dff 8.43%,#44d5bb 87.45%);' +
      'display:grid;place-items:center;color:#fff;pointer-events:none;' +
      'box-shadow:0 6px 16px rgba(21,111,247,.4);',
  );

  const svgNS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(svgNS, 'svg');
  svg.setAttribute('width', '14');
  svg.setAttribute('height', '14');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('fill', '#fff');
  const path = document.createElementNS(svgNS, 'path');
  path.setAttribute('d', PIN_PATH);
  svg.appendChild(path);
  el.appendChild(svg);

  const x0 = from.left + from.width / 2 - 13;
  const y0 = from.top + from.height / 2 - 13;
  const dx = to.left + to.width / 2 - 13 - x0;
  const dy = to.top + to.height / 2 - 13 - y0;

  el.style.left = `${x0}px`;
  el.style.top = `${y0}px`;
  document.body.appendChild(el);

  const anim = el.animate(
    [
      { transform: 'translate(0,0) scale(1) rotate(0deg)', opacity: 1 },
      { transform: `translate(${dx * 0.5}px,${dy * 0.5 - 26}px) scale(1.15) rotate(-12deg)`, opacity: 1, offset: 0.5 },
      { transform: `translate(${dx}px,${dy}px) scale(0.55) rotate(6deg)`, opacity: 0 },
    ],
    { duration: 460, easing: 'cubic-bezier(.45,.05,.25,1)' },
  );

  anim.onfinish = () => {
    el.remove();
    onFinish?.();
  };
}
