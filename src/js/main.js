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

import '/components/smb-alert-dialog/smb-alert-dialog.js';
import '/components/smb-dialog/smb-dialog.js';
import '/components/smb-placeholder/smb-placeholder.js';
import '/components/smb-search/smb-search.js';
import '/components/smb-stack/smb-stack.js';
import '/components/smb-stack-page/smb-stack-page.js';
import '/components/smb-stack-switcher/smb-stack-switcher.js';
import '/components/smb-stack-tab/smb-stack-tab.js';
import '/components/smb-toast/smb-toast.js';

import {
  applyTranslations,
  getLocale,
} from './i18n.js';

import {
  getManifestInfo,
} from './about.js';

import {
  bindTooltipEvents,
} from './tooltip.js';

import {
  bindMenuEvents,
} from './menu.js';

import {
  openPreferencesDialog,
  setTheme,
  setViewMode,
  userPreferences,
} from './preferences.js';

import {
  initDB,
} from './db.js';

import {
  wipeData,
} from './wipe.js';

import {
  addScript,
  copyScript,
  deleteScript,
  editScript,
  filterScripts,
  renderScripts,
  saveScript,
} from './scripts.js';

const actions = {
  change: {
    setTheme,
  },

  click: {
    addScript,
    copyScript,
    deleteScript,
    editScript,
    openPreferencesDialog,
    setViewMode,
    wipeData,
  },

  input: {
    filterScripts,
  },

  submit: {
    saveScript,
  },
};

function handleAction(event, actions) {
  const element = event.target.closest('[data-action]');
  if (!element) return;

  const { action } = element.dataset;
  const eventType = event.type;

  const handler = actions[eventType]?.[action];
  if (!handler) return;

  if (event.type === 'submit') event.preventDefault();

  const param = eventType === 'change' ? event.target.value : element;
  handler(param, event, element);
}

async function init() {
  const manifest = getManifestInfo();
  const pendingToast = sessionStorage.getItem('pendingToast');

  document.documentElement.lang = getLocale();
  document.title = manifest.name;

  applyTranslations();

  await initDB();
  await renderScripts();

  setTheme(userPreferences.theme);
  setViewMode(userPreferences.viewMode);

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      document.body.removeAttribute('data-loading');
    });
  });

  if (pendingToast) {
    sessionStorage.removeItem('pendingToast');

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const toast = document.createElement('smb-toast');

        toast.message = pendingToast;
        toast.show('main-toast');
      });
    });
  }
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

  bindTooltipEvents();
  bindMenuEvents();
}

bindEvents();
init();
