/**
 * Samambaia - A simple scripts manager.
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

import {
  formatShortcut,
} from './shortcuts.js';

const tooltip = document.getElementById('tooltip');
const SHOW_DELAY = 500;
const HIDE_DELAY = 100;

let showTimer = 0;
let hideTimer = 0;
let anchorId = 0;
let currentTarget = null;
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

  if (element === currentTarget && tooltip.matches(':popover-open')) {
    clearTimeout(hideTimer);
    return;
  }

  showTimer = setTimeout(() => {
    const label = document.getElementById('tooltip-label');
    const shortcutElement = document.getElementById('tooltip-shortcut');
    const shortcut = element.dataset.shortcutText;

    label.textContent = element.getAttribute('aria-label') ?? '';
    shortcutElement.hidden = !shortcut;
    shortcutElement.textContent = shortcut ? `(${shortcut})` : '';

    clearTimeout(hideTimer);
    currentTarget = element;

    tooltip.style.positionAnchor = getAnchor(element);
    tooltip.showPopover();
  }, SHOW_DELAY);
}

function close() {
  currentTarget = null;

  if (!tooltip.matches(':popover-open')) return;

  tooltip.hidePopover();
}

function hide() {
  clearTimeout(showTimer);
  clearTimeout(hideTimer);

  close();
}

function scheduleHide() {
  clearTimeout(showTimer);
  clearTimeout(hideTimer);

  hideTimer = setTimeout(close, HIDE_DELAY);
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

    scheduleHide();
  });

  tooltip.addEventListener('pointerenter', () => {
    clearTimeout(hideTimer);
  });

  tooltip.addEventListener('pointerleave', (event) => {
    if (currentTarget?.contains(event.relatedTarget)) return;

    scheduleHide();
  });

  document.addEventListener('pointerdown', () => {
    inputModality = 'pointer';
    hide();
  });

  document.addEventListener('keydown', (event) => {
    inputModality = 'keyboard';

    if (event.key !== 'Escape' || !tooltip.matches(':popover-open')) return;

    event.preventDefault();
    event.stopPropagation();
    hide();
  }, true);

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
