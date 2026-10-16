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

import {
  t,
} from './i18n.js';

const DEFAULT_PREFERENCES = {
  theme: 'system',
  viewMode: 'grid',
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

function toggleSidebar(button, value) {
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

export function setViewMode(value) {
  const validValue = value === 'grid' || value === 'list' ? value : null;
  const currentView = userPreferences.viewMode
    ?? DEFAULT_PREFERENCES.viewMode
    ?? 'grid';
  const newView = validValue ?? (currentView === 'grid' ? 'list' : 'grid');

  userPreferences.viewMode = newView;

  const container = document.getElementById('scripts-container');
  if (container) container.dataset.view = newView;

  const button = document.getElementById('view-toggle-button');
  if (!button) return;

  const label = newView === 'grid'
    ? t('listView')
    : t('gridView');

  button.setAttribute('aria-label', label);
  button.setAttribute('aria-pressed', newView === 'grid');
}
