const tooltip = document.querySelector('.tooltip');

const SHOW_DELAY = 100;

let showTimer = 0;
let anchorId = 0;
let inputModality = 'pointer';

const anchorNames = new WeakMap();

function findTooltipTarget(event) {
  return event.composedPath().find(
    (el) => el instanceof Element && el.matches('[data-tooltip]:not(:disabled)')
  );
}

function getAnchor(element) {
  let anchor = anchorNames.get(element);

  if (!anchor) {
    anchor = `--tooltip-${++anchorId}`;
    anchorNames.set(element, anchor);

    element.style.anchorName = element.style.anchorName
      ? `${element.style.anchorName}, ${anchor}`
      : anchor;
  }

  return anchor;
}

function show(element) {
  clearTimeout(showTimer);

  showTimer = setTimeout(() => {
    tooltip.textContent = element.getAttribute('aria-label');
    tooltip.style.positionAnchor = getAnchor(element);
    tooltip.showPopover();
  }, SHOW_DELAY);
}

function hide() {
  clearTimeout(showTimer);

  if (!tooltip.matches(':popover-open')) return;

  tooltip.hidePopover();
}

export function bindTooltipEvents() {
  document.addEventListener('pointerover', (event) => {
    inputModality = 'pointer';

    const element = findTooltipTarget(event);
    if (element) show(element);
  });

  document.addEventListener('pointerout', (event) => {
    if (findTooltipTarget(event)) hide();
  });

  document.addEventListener('pointerdown', () => {
    inputModality = 'pointer';
    hide();
  });

  document.addEventListener('keydown', () => {
    inputModality = 'keyboard';
  });

  document.addEventListener('focusin', (event) => {
    if (inputModality !== 'keyboard') return;

    const element = findTooltipTarget(event);
    if (element) show(element);
  });

  document.addEventListener('focusout', (event) => {
    if (findTooltipTarget(event)) hide();
  });

  window.addEventListener('scroll', hide, true);
  window.addEventListener('resize', hide);
}
