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
  COLORS,
} from './colors.js';

import {
  state,
} from './state.js';

import {
  t,
} from './i18n.js';

const DEFAULT_PREFERENCES = {
  accentColor: 'blue',
  backupReminder: true,
  highContrast: false,
  keyboardShortcuts: true,
  largeText: false,
  recentScripts: true,
  sidebars: {
    labels: true,
    scratchpad: false,
    variables: true,
  },
  textExpansion: {
    enabled: true,
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

export function applyPreferences(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return;

  for (const key of Object.keys(DEFAULT_PREFERENCES)) {
    if (data[key] === undefined) continue;
    userPreferences[key] = data[key];
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

export function openPreferencesDialog(page = 'appearance') {
  const dialog = document.getElementById('preferences-dialog');
  const stack = dialog.querySelector('smb-stack');

  stack.show(page);
  dialog.showModal();
}

export function setAccentColor(value, event) {
  const rawColor = value ?? event?.target?.value ?? DEFAULT_PREFERENCES.accentColor;
  const accentColor = COLORS.includes(rawColor)
    ? rawColor
    : DEFAULT_PREFERENCES.accentColor;

  userPreferences.accentColor = accentColor;
  document.documentElement.setAttribute('data-accent-color', accentColor);
  updatePreferenceControl('accent-color', accentColor);
}

export function setBackupReminder(value, event) {
  const isEnabled =
    (typeof value === 'boolean' ? value : event?.target?.checked)
    ?? DEFAULT_PREFERENCES.backupReminder ?? true;

  userPreferences.backupReminder = isEnabled;
  updatePreferenceControl('backup-reminder', isEnabled);

  document.dispatchEvent(new Event('backupReminder:changed'));
}

export function setHighContrast(value, event) {
  const root = document.documentElement;
  const isHighContrastEnabled =
    (typeof value === 'boolean' ? value : event?.target?.checked)
    ?? DEFAULT_PREFERENCES.highContrast;

  userPreferences.highContrast = isHighContrastEnabled;

  root.setAttribute('data-high-contrast', isHighContrastEnabled);

  updatePreferenceControl('high-contrast', isHighContrastEnabled);
}

export function setKeyboardShortcuts(value, event) {
  const isEnabled =
    (typeof value === 'boolean' ? value : event?.target?.checked)
    ?? DEFAULT_PREFERENCES.keyboardShortcuts;

  userPreferences.keyboardShortcuts = isEnabled;
  document.documentElement.setAttribute('data-keyboard-shortcuts', isEnabled);
  updatePreferenceControl('keyboard-shortcuts', isEnabled);

  document.dispatchEvent(new Event('keyboardShortcuts:changed'));
}

export function setLargeText(value, event) {
  const isLargeTextEnabled =
    (typeof value === 'boolean' ? value : event?.target?.checked)
    ?? DEFAULT_PREFERENCES.largeText;

  userPreferences.largeText = isLargeTextEnabled;
  document.documentElement.setAttribute('data-large-text', isLargeTextEnabled);
  updatePreferenceControl('large-text', isLargeTextEnabled);
}

export function setRecentScripts(value, event) {
  const isEnabled =
    (typeof value === 'boolean' ? value : event?.target?.checked)
    ?? DEFAULT_PREFERENCES.recentScripts;

  userPreferences.recentScripts = isEnabled;
  updatePreferenceControl('recent-scripts', isEnabled);

  document.dispatchEvent(new Event('recentScripts:changed'));
}

export function setTextExpansion(value, event) {
  const isEnabled =
    (typeof value === 'boolean' ? value : event?.target?.checked)
    ?? DEFAULT_PREFERENCES.textExpansion.enabled;

  userPreferences.textExpansion.enabled = isEnabled;
  updatePreferenceControl('text-expansion', isEnabled);
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

export function clearRecentHistory() {
  const dialog = document.createElement('smb-alert-dialog');

  dialog.heading = t('clearRecentHistoryHeading');
  dialog.body = t('clearRecentHistoryBody');

  dialog.addResponses([
    {
      id: 'cancel',
      label: t('cancel'),
      appearance: 'default',
    },
    {
      id: 'clear',
      label: t('clearHistory'),
      appearance: 'destructive',
    },
  ]);

  dialog.addEventListener('response', (event) => {
    if (event.detail.response !== 'clear') return;

    state.recentScripts = [];

    document.dispatchEvent(new Event('recentScripts:changed'));

    const toast = document.createElement('smb-toast');

    toast.message = t('recentHistoryCleared');
    toast.show('preferences-dialog-toast');
  }, { once: true });

  dialog.showModal();
}
