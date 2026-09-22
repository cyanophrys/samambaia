/**
 * Copyright (C) 2026 Raul Sousa
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 */

const tooltip = document.getElementById('tooltip');

const SHOW_DELAY = 500;

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
    if (!element) return;

    if (element.contains(event.relatedTarget)) return;

    show(element);
  });

  document.addEventListener('pointerout', (event) => {
    const element = findTooltipTarget(event);
    if (!element) return;

    if (element.contains(event.relatedTarget)) return;

    hide();
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
