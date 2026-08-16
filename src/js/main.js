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

import '/src/components/smb-alert-dialog/smb-alert-dialog.js';
import '/src/components/smb-dialog/smb-dialog.js';
import '/src/components/smb-stack/smb-stack.js';
import '/src/components/smb-toast/smb-toast.js';

import {
  clearField,
  closeDialog,
  openDialog,
  getManifestInfo,
  handleAction,
  handleShortcut,
  toggleSidebar,
  syncFormControlState,
} from './utils.js';

import {
  setAccentColor,
  setHighContrast,
  setTheme,
  setLargeText,
  toggleLabelsSidebar,
  toggleVariablesSidebar,
  userPreferences,
} from './preferences.js';

import {
  initDB,
} from './db.js';

import {
  addScript,
  deleteScript,
  editScript,
  renderScripts,
  saveScript,
} from './scripts.js';

import {
  KEYBOARD_SHORTCUTS,
} from './shortcuts.js';

const actions = {
  change: {
    setAccentColor,
    setHighContrast,
    setLargeText,
    setTheme,
    syncFormControlState,
  },

  click: {
    addScript,
    clearField,
    closeDialog: (target) => closeDialog(target?.dataset?.target ?? target),
    deleteScript,
    editScript,
    openAboutDialog,
    openDialog: (target) => openDialog(target?.dataset?.target ?? target),
    toggleLabelsSidebar,
    toggleVariablesSidebar,
  },

  input: {
  },

  submit: {
    saveScript,
  },
};

async function init() {
  await initDB();
  await renderScripts();

  setAccentColor(userPreferences.accentColor);
  setHighContrast(userPreferences.highContrast);
  setLargeText(userPreferences.largeText);
  setTheme(userPreferences.theme);
  toggleLabelsSidebar(userPreferences.sidebars.labels);
  toggleVariablesSidebar(userPreferences.sidebars.variables);
}

function bindEvents() {
  const prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)');

  prefersDarkMode.addEventListener('change', () => {
    if (userPreferences.theme === 'system') setTheme('system');
  });

  document.addEventListener('click', (e) => handleAction(e, actions));
  document.addEventListener('change', (e) => handleAction(e, actions));
  document.addEventListener('input', (e) => handleAction(e, actions));
  document.addEventListener('submit', (e) => handleAction(e, actions));
  document.addEventListener('keydown', (e) => handleShortcut(e, actions, KEYBOARD_SHORTCUTS));
}

async function openAboutDialog() {
  const dialog = document.getElementById('about-dialog');
  const name = dialog.querySelector('#about-name');
  const version = dialog.querySelector('#about-version');
  const author = dialog.querySelector('#about-author');
  const homepage_url = dialog.querySelector('#about-homepage');

  try {
    const manifest = await getManifestInfo();

    name.textContent = manifest.name;
    version.textContent = manifest.version;
    author.textContent = manifest.author;
    homepage_url.href = manifest.homepage_url;
    homepage_url.textContent = manifest.homepage_url;
  } catch (error) {
    console.error(error);
  }

  openDialog(dialog);
}

bindEvents();
init();
