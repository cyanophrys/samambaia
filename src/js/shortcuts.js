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

export const KEYBOARD_SHORTCUTS = [
  {
    name: "addScript",
    action: "addScript",
    alt: true,
    key: "n",
  },
  {
    name: "addLabel",
    action: "addLabel",
    alt: true,
    key: "l",
  },
  {
    name: "addVariable",
    action: "addVariable",
    alt: true,
    shift: true,
    key: "v",
  },
  {
    name: "exportBackup",
    action: "exportBackup",
    alt: true,
    key: "x",
  },
  {
    name: "expandScratchpad",
    action: "expandScratchpad",
    alt: true,
    shift: true,
    key: "p",
  },
  {
    name: "restoreBackup",
    action: "restoreBackup",
    alt: true,
    key: "i",
  },
  {
    name: "openPreferences",
    action: "openPreferencesDialog",
    alt: true,
    key: ",",
  },
  {
    name: "openShortcuts",
    action: "openShortcutsDialog",
    alt: true,
    shift: true,
    key: "?",
  },
  {
    name: "scrollScriptsView",
    action: "scrollScriptsView",
    alt: true,
    key: "ArrowUp",
  },
  {
    name: "setViewMode",
    action: "setViewMode",
    alt: true,
    key: "v",
  },
  {
    name: "searchScripts",
    action: "focusScriptsSearch",
    alt: true,
    key: "s",
  },
  {
    name: "showAllScripts",
    action: "filterByLabel",
    target: "all",
    alt: true,
    key: "Backspace",
  },
  {
    name: "showFavorites",
    action: "filterByLabel",
    target: "favorites",
    alt: true,
    key: "b",
  },
  {
    name: "showRecent",
    action: "filterByLabel",
    target: "recent",
    alt: true,
    key: "r",
  },
  {
    name: "toggleLabelsSidebar",
    action: "toggleLabelsSidebar",
    alt: true,
    key: "ArrowLeft",
  },
  {
    name: "toggleScratchpadSidebar",
    action: "toggleScratchpadSidebar",
    alt: true,
    key: "p",
  },
  {
    name: "toggleVariablesSidebar",
    action: "toggleVariablesSidebar",
    alt: true,
    key: "ArrowRight",
  },
];

const KEY_LABELS = {
  ArrowLeft: "←",
  ArrowRight: "→",
  ArrowUp: "↑",
  Backspace: "⌫",
};

export function formatShortcut(shortcut) {
  const keys = typeof shortcut === 'string'
    ? shortcut.split('+')
    : [
        shortcut.ctrl && 'Ctrl',
        shortcut.shift && 'Shift',
        shortcut.alt && 'Alt',
        shortcut.meta && 'Meta',
        shortcut.key,
      ].filter(Boolean);

  return keys.map((key) => {
    return KEY_LABELS[key] ??
      (key.length === 1 ? key.toUpperCase() : key);
  }).join('+');
}

export function handleShortcut(event, actions, shortcuts) {
  const target = event.target;

  const isEditable =
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLSelectElement ||
    target.isContentEditable;

  if (isEditable && !event.ctrlKey && !event.metaKey) return;

  const shortcutString = [
    (event.ctrlKey || event.metaKey) && "ctrl",
    event.shiftKey && "shift",
    event.altKey && "alt",
    event.key.toLowerCase(),
  ].filter(Boolean).join("+");

  const element = document.querySelector(`[data-keyboard-shortcut="${shortcutString}"]`);

  if (element) {
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

    return;
  }

  const shortcut = shortcuts.find((shortcut) => {
    return (
      shortcut.key.toLowerCase() === event.key.toLowerCase() &&
      !!shortcut.ctrl === (event.ctrlKey || event.metaKey) &&
      !!shortcut.alt === event.altKey &&
      !!shortcut.shift === event.shiftKey
    );
  });

  if (!shortcut) return;

  const handler = actions.click?.[shortcut.action];
  if (!handler) return;

  event.preventDefault();

  const targetElement = shortcut.target
    ? document.getElementById(shortcut.target) ?? document.querySelector(shortcut.target) ?? shortcut.target
    : null;

  handler(targetElement, event, targetElement);
}

export function applyShortcutDisplays() {
  const shortcutDisplays = document.querySelectorAll('[data-shortcut-display]');

  shortcutDisplays.forEach((container) => {
    const shortcut = KEYBOARD_SHORTCUTS.find(
      (shortcut) => shortcut.name === container.dataset.shortcutDisplay
    );

    if (!shortcut) return;

    const keys = formatShortcut(shortcut).split('+');

    container.replaceChildren(
      ...keys.map((key) => {
        const kbd = document.createElement('kbd');
        kbd.textContent = key;
        return kbd;
      })
    );
  });
}

export function applyAriaKeyshortcuts() {
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

    const selector = shortcut.target
      ? `[data-action="${CSS.escape(shortcut.action)}"][data-target="${CSS.escape(shortcut.target)}"]`
      : `[data-action="${CSS.escape(shortcut.action)}"]`;

    document.querySelectorAll(selector).forEach((element) => {
      element.setAttribute('aria-keyshortcuts', ariaShortcut);
    });
  }
}

export function openShortcutsDialog() {
  const dialog = document.getElementById('shortcuts-dialog');
  const searchInput = dialog.querySelector('smb-search');

  searchInput.value = '';

  dialog.showModal();
}

export function filterShortcuts() {
  const searchInput = document.getElementById('shortcuts-search-input');
  const stack = document.getElementById('shortcuts-stack');
  const results = document.getElementById('shortcuts-results-section');
  const query = searchInput?.value.toLowerCase().trim() ?? '';

  if (!query) {
    results?.replaceChildren();
    stack?.show('shortcuts');
    return;
  }

  const shortcuts = document.querySelectorAll(
    '[data-page-name="shortcuts"] .shortcut-item'
  );

  const matches = [...shortcuts].filter((shortcut) => {
    const label = shortcut.querySelector('[data-i18n]')?.textContent.toLowerCase() ?? '';

    return label.includes(query);
  });

  results?.replaceChildren(
    ...matches.map((shortcut) => shortcut.cloneNode(true))
  );

  stack?.show(
    matches.length
      ? 'shortcuts-results'
      : 'no-shortcuts-results'
  );
}
