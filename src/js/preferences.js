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

import {
  createStore,
  loadState,
} from './store.js';

import {
  toggleSidebar,
  syncFormControlState,
} from './utils.js';

import {
  t,
} from './i18n.js';

const ACCENT_COLORS = [
  'blue',
  'teal',
  'green',
  'yellow',
  'brown',
  'orange',
  'lavender',
  'red',
  'pink',
  'purple',
  'slate',
];

const DEFAULT_PREFERENCES = {
  accentColor: 'blue',
  backupReminder: true,
  highContrast: false,
  largeText: false,
  recentScripts: true,
  sidebars: {
    labels: true,
    scratchpad: false,
    variables: false,
  },
  theme: 'system',
  viewMode: 'grid',
};

export const userPreferences = createStore(
  await loadState('userPreferences', DEFAULT_PREFERENCES),
  {
    storageKey: 'userPreferences'
  }
);

export function toggleLabelsSidebar(value) {
  const button = document.querySelector('[data-action="toggleLabelsSidebar"]');
  if (!button) return;

  const isOpen = toggleSidebar(button, value);

  userPreferences.sidebars.labels = isOpen;
}

export function toggleVariablesSidebar(value) {
  const button = document.querySelector('[data-action="toggleVariablesSidebar"]');
  if (!button) return;

  const isOpen = toggleSidebar(button, value);

  userPreferences.sidebars.variables = isOpen;
}

export function toggleScratchpadSidebar(value) {
  const button = document.querySelector('[data-action="toggleScratchpadSidebar"]');
  if (!button) return;

  const isOpen = toggleSidebar(button, value);

  userPreferences.sidebars.scratchpad = isOpen;
}

export function setTheme(value) {
  const root = document.documentElement;
  const body = document.body;
  const prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)');
  const theme = value ?? DEFAULT_PREFERENCES.theme;

  userPreferences.theme = theme;

  if (theme === 'system') {
    root.dataset.theme = prefersDarkMode.matches ? 'dark' : 'light';
  } else {
    root.dataset.theme = theme;
  }

  syncFormControlState('theme', theme);

  body.classList.add('transitions-disabled');

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      body.classList.remove('transitions-disabled');
    });
  });
}

export function setAccentColor(value, event) {
  const rawColor = value ?? event?.target?.value ?? DEFAULT_PREFERENCES.accentColor;
  const accentColor = ACCENT_COLORS.includes(rawColor)
    ? rawColor
    : DEFAULT_PREFERENCES.accentColor;

  userPreferences.accentColor = accentColor;
  document.documentElement.setAttribute('data-accent-color', accentColor);
  syncFormControlState('accent-color', accentColor);
}

export function setLargeText(value, event) {
  const isLargeTextEnabled =
    (typeof value === 'boolean' ? value : event?.target?.checked)
    ?? DEFAULT_PREFERENCES.largeText;

  userPreferences.largeText = isLargeTextEnabled;
  document.documentElement.setAttribute('data-large-text', isLargeTextEnabled);
  syncFormControlState('large-text', isLargeTextEnabled);
}

export function setHighContrast(value, event) {
  const root = document.documentElement;
  const body = document.body;
  const isHighContrastEnabled =
    (typeof value === 'boolean' ? value : event?.target?.checked)
    ?? DEFAULT_PREFERENCES.highContrast;

  userPreferences.highContrast = isHighContrastEnabled;
  root.setAttribute('data-high-contrast', isHighContrastEnabled);
  syncFormControlState('high-contrast', isHighContrastEnabled);

  body.classList.add('transitions-disabled');

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      body.classList.remove('transitions-disabled');
    });
  });
}

export function setViewMode(value) {
  const validValue = value === 'grid' || value === 'list' ? value : null;
  const currentView = userPreferences.viewMode
    ?? DEFAULT_PREFERENCES.viewMode
    ?? 'grid';
  const newView = validValue ?? (currentView === 'grid' ? 'list' : 'grid');

  userPreferences.viewMode = newView;

  const scriptsContent = document.getElementById('custom-scripts');
  if (scriptsContent) scriptsContent.dataset.view = newView;

  const button = document.getElementById('view-toggle-button');
  if (!button) return;

  const label = newView === 'grid'
    ? t('listView')
    : t('gridView');

  button.setAttribute('aria-label', label);
  button.setAttribute('aria-pressed', newView === 'grid');
}

export function setBackupReminder(value, event) {
  const isEnabled =
    (typeof value === 'boolean' ? value : event?.target?.checked)
    ?? DEFAULT_PREFERENCES.backupReminder ?? true;

  userPreferences.backupReminder = isEnabled;
  syncFormControlState('backup-reminder', isEnabled);

  document.dispatchEvent(new Event('backupReminder:changed'));
}

export function setRecentScripts(value, event) {
  const isEnabled =
    (typeof value === 'boolean' ? value : event?.target?.checked)
    ?? DEFAULT_PREFERENCES.recentScripts;

  userPreferences.recentScripts = isEnabled;
  syncFormControlState('recent-scripts', isEnabled);

  document.dispatchEvent(new Event('recentScripts:changed'));
}
