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

export function getManifestInfo() {
  return chrome.runtime.getManifest();
}

export function handleAction(event, actions) {
  const ignored = event.target.closest('[data-action-ignore]');
  if (ignored) return;

  const element = event.target.closest('[data-action]');
  if (!element) return;

  const { action, target } = element.dataset;
  const eventType = event.type;

  const handler = actions[eventType]?.[action];
  if (!handler) return;

  if (event.type === 'submit') event.preventDefault();

  const param = eventType === 'change' ? event.target.value : element;
  handler(param, event, element);
}

export function clearField(target) {
  const field = target.dataset.target
    ? document.getElementById(target.dataset.target)
    : target.previousElementSibling;

  if (!(field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement))
    return;

  field.value = '';
  field.focus();
  field.dispatchEvent(new Event('input', { bubbles: true }));
}

export function announce(message) {
  const announcer = document.getElementById('announcer');
  if (!announcer) return;

  announcer.textContent = '';
  requestAnimationFrame(() => {
    announcer.textContent = message;
  });
}

export function debounce(fn, delay) {
  let timeout = null;

  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), delay);
  };
}
