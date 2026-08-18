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
    name: "importBackup",
    action: "importBackup",
    alt: true,
    key: "i",
  },
  {
    name: "openSettings",
    action: "openDialog",
    target: "settings-dialog",
    alt: true,
    key: ",",
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
    action: "activate",
    target: "scripts-search-input",
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
    name: "toggleLabelsSidebar",
    action: "toggleLabelsSidebar",
    alt: true,
    key: "ArrowLeft",
  },
  {
    name: "toggleVariablesSidebar",
    action: "toggleVariablesSidebar",
    alt: true,
    key: "ArrowRight",
  },
];

export function applyShortcutDisplays() {
  const keyLabels = {
    ArrowLeft: "←",
    ArrowRight: "→",
    ArrowUp: "↑",
    Backspace: "⌫",
  };

  const formatKey = (key) => keyLabels[key] ??
    (key.length === 1 ? key.toUpperCase() : key);
  const shortcutDisplays = document.querySelectorAll('[data-shortcut-display]');

  shortcutDisplays.forEach((container) => {
    const shortcut = KEYBOARD_SHORTCUTS.find(
      (shortcut) => shortcut.name === container.dataset.shortcutDisplay
    );

    if (!shortcut) return;

    const keys = [
      shortcut.ctrl && 'Ctrl',
      shortcut.shift && 'Shift',
      shortcut.alt && 'Alt',
      shortcut.meta && 'Meta',
      formatKey(shortcut.key),
    ].filter(Boolean);

    container.replaceChildren(
      ...keys.map((key) => {
        const kbd = document.createElement('kbd');
        kbd.textContent = key;
        return kbd;
      })
    );
  });
}
