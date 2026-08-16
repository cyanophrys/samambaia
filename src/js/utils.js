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

export function handleShortcut(event, actions, shortcuts) {
  const target = event.target;

  if (
    !event.ctrlKey &&
    !event.metaKey &&
    !event.altKey &&
    (
      target instanceof HTMLInputElement ||
      target instanceof HTMLTextAreaElement ||
      target instanceof HTMLSelectElement ||
      target.isContentEditable
    )
  ) return;

  const activateElement = (element) => {
    if (!element) return;

    event.preventDefault();

    if (
      element instanceof HTMLInputElement ||
      element instanceof HTMLTextAreaElement ||
      element instanceof HTMLSelectElement
    ) {
      element.focus();
    } else if (
      element instanceof HTMLButtonElement ||
      element instanceof HTMLAnchorElement ||
      element.dataset.action
    ) {
      element.click();
    } else {
      element.focus();
    }
  };

  const shortcutString = [
    (event.ctrlKey || event.metaKey) && "ctrl",
    event.shiftKey && "shift",
    event.altKey && "alt",
    event.key.toLowerCase(),
  ].filter(Boolean).join("+");

  const element = document.querySelector(`[data-keyboard-shortcut="${shortcutString}"]`);

  if (element) {
    activateElement(element);
    return;
  }

  const shortcut = shortcuts.find((shortcut) => {
    return (
      shortcut.key.toLowerCase() === event.key.toLowerCase() &&
      !!shortcut.ctrl === (event.ctrlKey || event.metaKey) &&
      !!shortcut.alt === event.altKey &&
      (shortcut.shift ? event.shiftKey : true)
    );
  });

  if (!shortcut) return;

  if (shortcut.action === "activate" && shortcut.target) {
    const targetElement = document.getElementById(shortcut.target) ?? document.querySelector(shortcut.target);
    activateElement(targetElement);
    return;
  }

  const handler = actions.click?.[shortcut.action];
  if (!handler) return;

  event.preventDefault();

  const targetElement = shortcut.target
    ? document.getElementById(shortcut.target) ?? document.querySelector(shortcut.target) ?? shortcut.target
    : null;

  handler(targetElement, event, targetElement);
}

export function toggleSidebar(button, value) {
  if (!(button instanceof HTMLElement)) return;

  const sidebar = document.getElementById(button.getAttribute('aria-controls'));
  if (!sidebar) return;

  const isCollapsed = typeof value === 'boolean'
    ? !value
    : !sidebar.hasAttribute('data-collapsed');

  sidebar.toggleAttribute('data-collapsed', isCollapsed);
  button.setAttribute('aria-expanded', String(!isCollapsed));

  return !isCollapsed;
}
