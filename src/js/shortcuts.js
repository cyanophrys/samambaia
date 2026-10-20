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

const KEY_LABELS = {
  ArrowLeft: "←",
  ArrowRight: "→",
  ArrowUp: "↑",
  Backspace: "⌫",
};

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

export function formatShortcut(shortcut, { format = 'keys' } = {}) {
  const keys = typeof shortcut === 'string'
    ? shortcut.split('+')
    : [
        shortcut.ctrl && 'Ctrl',
        shortcut.shift && 'Shift',
        shortcut.alt && 'Alt',
        shortcut.meta && 'Meta',
        shortcut.key,
      ].filter(Boolean);

  const labels = keys.map((key) => {
    return KEY_LABELS[key] ??
      (key.length === 1 ? key.toUpperCase() : key);
  });

  if (format === 'text')
    return labels.join('+');

  return labels;
}

export function createShortcutDisplay(shortcut) {
  const display = document.createElement('div');

  display.className = 'shortcut-display';

  display.append(
    ...formatShortcut(shortcut).map((key) => {
      const kbd = document.createElement('kbd');

      kbd.className = 'kbd';
      kbd.textContent = key;
      return kbd;
    })
  );

  return display;
}

export function applyShortcutDisplays() {
  const shortcutDisplays = document.querySelectorAll('[data-shortcut-display]');

  shortcutDisplays.forEach((container) => {
    const shortcut = KEYBOARD_SHORTCUTS.find(
      (shortcut) => shortcut.name === container.dataset.shortcutDisplay
    );

    if (!shortcut) return;

    const display = createShortcutDisplay(shortcut);

    container.replaceChildren(...display.childNodes);
  });
}

export function applyAriaKeyshortcuts(enabled = true) {
  for (const shortcut of KEYBOARD_SHORTCUTS) {
    const modifiers = [];

    if (shortcut.ctrl) modifiers.push('Control');
    if (shortcut.alt) modifiers.push('Alt');
    if (shortcut.shift) modifiers.push('Shift');
    if (shortcut.meta) modifiers.push('Meta');

    let key = shortcut.key;

    if (key === '?') {
      if (!shortcut.shift) modifiers.push('Shift');
      key = '/';
    }

    const ariaShortcut = [
      ...modifiers,
      key.length === 1 ? key.toUpperCase() : key,
    ].join('+');

    const shortcutText = formatShortcut(shortcut, { format: 'text' });

    const selector = shortcut.target
      ? `[data-action="${CSS.escape(shortcut.action)}"][data-target="${CSS.escape(shortcut.target)}"]`
      : `[data-action="${CSS.escape(shortcut.action)}"]`;

    document.querySelectorAll(selector).forEach((element) => {
      if (enabled) {
        element.setAttribute('aria-keyshortcuts', ariaShortcut);
        element.dataset.shortcutText = shortcutText;
      } else {
        element.removeAttribute('aria-keyshortcuts');
        delete element.dataset.shortcutText;
      }
    });
  }
}

export function openShortcutsDialog() {
  const dialog = document.getElementById('shortcuts-dialog');
  const searchInput = dialog.querySelector('smb-search');

  searchInput.value = '';
  filterShortcuts();

  dialog.showModal();
}

export function filterShortcuts() {
  const input = document.querySelector('[data-action="filterShortcuts"]');
  const stack = document.getElementById('shortcuts-stack');
  const query = input?.value.toLowerCase().trim() ?? '';

  if (!stack) return;

  if (!query) {
    stack.show('shortcuts');
    return;
  }

  const shortcutsPage = stack.querySelector(
    'smb-stack-page[page-name="shortcuts"]'
  );

  const searchResults = stack.querySelector(
    'smb-stack-page[page-name="search-results"] #shortcuts-search-results'
  );

  const shortcuts = shortcutsPage?.querySelectorAll('.list-row:has(kbd)') ?? [];

  const matchingShortcuts = [...shortcuts]
    .filter(shortcut => {
      const label = shortcut.querySelector('span')?.textContent.toLowerCase() ?? '';

      return label.includes(query);
    });

  if (matchingShortcuts.length === 0) {
    stack.show('no-search-results');
    return;
  }

  if (searchResults)
    searchResults.replaceChildren(
      ...matchingShortcuts.map(shortcut => shortcut.cloneNode(true))
    );

  stack.show('search-results');
}
