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

const SHORTCUT_CONTAINERS = '[popover], smb-dialog';

export const KEYBOARD_SHORTCUTS = [
  {
    name: 'addScript',
    action: 'addScript',
    alt: true,
    key: 'n',
  },
  {
    name: 'addLabel',
    action: 'addLabel',
    alt: true,
    key: 'l',
  },
  {
    name: 'addVariable',
    action: 'addVariable',
    alt: true,
    shift: true,
    key: 'v',
  },
  {
    name: 'copyScratchpad',
    action: 'copyScratchpad',
    alt: true,
    shift: true,
    key: 'c',
  },
  {
    name: 'exportBackup',
    action: 'exportBackup',
    alt: true,
    key: 'x',
  },
  {
    name: 'expandScratchpad',
    action: 'expandScratchpad',
    alt: true,
    key: 'p',
  },
  {
    name: 'filterScripts',
    action: 'activate',
    target: '[data-action="filterScripts"]',
    key: '/',
  },
  {
    name: 'filterScripts',
    action: 'activate',
    target: '[data-action="filterScripts"]',
    alt: true,
    key: 's',
  },
  {
    name: 'restoreBackup',
    action: 'restoreBackup',
    alt: true,
    key: 'i',
  },
  {
    name: 'openPreferences',
    action: 'openPreferencesDialog',
    alt: true,
    key: ',',
  },
  {
    name: 'openShortcuts',
    action: 'openShortcutsDialog',
    alt: true,
    shift: true,
    key: '?',
  },
  {
    name: 'setViewMode',
    action: 'setViewMode',
    alt: true,
    key: 'v',
  },
  {
    name: 'showAllScripts',
    action: 'filterByLabel',
    target: 'all',
    alt: true,
    key: 'a',
  },
  {
    name: 'showFavorites',
    action: 'filterByLabel',
    target: 'favorites',
    alt: true,
    key: 'b',
  },
  {
    name: 'showUnlabeled',
    action: 'filterByLabel',
    target: 'none',
    alt: true,
    key: 'u',
  },
  {
    name: 'toggleLabelsSidebar',
    action: 'toggleLabelsSidebar',
    alt: true,
    key: 'ArrowLeft',
  },
  {
    name: 'toggleScratchpadSidebar',
    action: 'toggleScratchpadSidebar',
    alt: true,
    shift: true,
    key: 'ArrowRight',
  },
  {
    name: 'toggleVariablesSidebar',
    action: 'toggleVariablesSidebar',
    alt: true,
    key: 'ArrowRight',
  },
];

export function handleShortcut(event, actions, shortcuts) {
  const target = event.composedPath()[0];

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

    const { action } = element.dataset;

    if (
      element instanceof HTMLInputElement ||
      element instanceof HTMLTextAreaElement ||
      element instanceof HTMLSelectElement
    ) {
      element.focus();
    } else if (element.closest(SHORTCUT_CONTAINERS)) {
      element.click();
      element.focus();
    } else if (
      element instanceof HTMLButtonElement ||
      element instanceof HTMLAnchorElement ||
      actions.click?.[action]
    ) {
      element.click();
    } else {
      element.focus();
    }
  };

  const shortcutString = [
    (event.ctrlKey || event.metaKey) && 'ctrl',
    event.shiftKey && 'shift',
    event.altKey && 'alt',
    event.key.toLowerCase(),
  ].filter(Boolean).join('+');

  const shortcut = shortcuts.find((shortcut) => {
    return (
      shortcut.key.toLowerCase() === event.key.toLowerCase() &&
      !!shortcut.ctrl === (event.ctrlKey || event.metaKey) &&
      !!shortcut.alt === event.altKey &&
      (shortcut.shift ? event.shiftKey : true)
    );
  });

  const byKey = [
    ...document.querySelectorAll(
      `[data-keyboard-shortcut="${CSS.escape(shortcutString)}"]`
    ),
  ];

  const byAction = shortcut
    ? [
        ...document.querySelectorAll(
          `[data-action="${CSS.escape(shortcut.action)}"]`
        ),
      ]
    : [];

  const isInOpenContainer = (element) => {
    const container = element.closest(SHORTCUT_CONTAINERS);

    if (!container) return false;

    return container.matches('[popover]')
      ? container.matches(':popover-open')
      : container.open;
  };

  const openElements = [...byKey, ...byAction].filter(isInOpenContainer);

  const element =
    openElements.find(element => element.closest('[popover]')) ??
    openElements[0] ??
    byKey.find(element => !element.closest(SHORTCUT_CONTAINERS));

  if (element) {
    activateElement(element);
    return;
  }

  if (!shortcut) return;

  if (shortcut.action === 'activate' && shortcut.target) {
    const targetElement = document.getElementById(shortcut.target) ??
      document.querySelector(shortcut.target);

    activateElement(targetElement);
    return;
  }

  const handler = actions.click?.[shortcut.action];
  if (!handler) return;

  event.preventDefault();

  const targetElement = shortcut.target
    ? document.getElementById(shortcut.target) ??
      document.querySelector(shortcut.target) ??
      shortcut.target
    : null;

  handler(targetElement, event, targetElement);
}
