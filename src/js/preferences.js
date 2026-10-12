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
  createStore,
  loadState,
} from './store.js';

const DEFAULT_PREFERENCES = {
  theme: 'system',
};

export const userPreferences = createStore(
  await loadState('userPreferences', DEFAULT_PREFERENCES),
  {
    storageKey: 'userPreferences'
  }
);

export function updatePreferenceControl(name, value) {
  const element = document.querySelector(`input[name="${name}"]`);
  if (!element) return;

  if (element.type === 'checkbox') {
    element.checked = Boolean(value);
  } else if (element.type === 'radio') {
    const targetElement = document.querySelector(`input[name="${name}"][value="${value}"]`);
    if (targetElement) targetElement.checked = true;
  }
}

export function openPreferencesDialog() {
  const dialog = document.getElementById('preferences-dialog');
  dialog.showModal();
}

export function setTheme(value) {
  const root = document.documentElement;
  const prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)');
  const theme = value ?? DEFAULT_PREFERENCES.theme;

  userPreferences.theme = theme;

  if (theme === 'system') {
    root.dataset.theme = prefersDarkMode.matches ? 'dark' : 'light';
  } else {
    root.dataset.theme = theme;
  }

  updatePreferenceControl('theme', theme);
}
