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
  bindDialogEvents,
} from './dialog.js';

import {
  openPreferencesDialog,
  setBackupReminder,
  setTheme,
  setViewMode,
  toggleLabelsSidebar,
  toggleScratchpadSidebar,
  toggleVariablesSidebar,
  userPreferences,
} from './preferences.js';

import {
  state,
} from './state.js';

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
  filterByLabel,
  filterScripts,
  renderScripts,
  saveScript,
  searchAllScripts,
  toggleFavoriteScript,
} from './scripts.js';

import {
  addLabel,
  deleteLabel,
  editLabel,
  filterScriptLabels,
  renderLabels,
  saveLabel,
  selectScriptLabels,
  saveLabelsSelection,
  toggleScriptLabel,
} from './labels.js';

import {
  addVariable,
  deleteVariable,
  editVariable,
  handleVariableValueInput,
  renderVariables,
  saveVariable,
} from './variables.js';

import {
  copyScratchpad,
  clearScratchpad,
  expandScratchpad,
  handleScratchpadInput,
  initScratchpad,
} from './scratchpad.js';

import {
  exportBackup,
  restoreBackup,
  toggleBackupBanner,
  warnBeforeUnload,
} from './backup.js';

import {
  debounce,
} from './utils.js';

const actions = {
  change: {
    setBackupReminder,
    setTheme,
  },

  click: {
    addLabel,
    addScript,
    addVariable,
    copyScratchpad,
    copyScript,
    clearScratchpad,
    deleteLabel,
    deleteScript,
    deleteVariable,
    editLabel,
    editScript,
    editVariable,
    expandScratchpad,
    exportBackup,
    filterByLabel,
    openPreferencesDialog,
    reload: () => window.location.reload(),
    restoreBackup,
    searchAllScripts,
    selectScriptLabels,
    setViewMode,
    toggleFavoriteScript,
    toggleLabelsSidebar,
    toggleScratchpadSidebar,
    toggleScriptLabel,
    toggleVariablesSidebar,
    wipeData,
  },

  input: {
    filterScripts,
    filterScriptLabels,
    handleScratchpadInput,
    handleVariableValueInput,
  },

  submit: {
    saveLabel,
    saveLabelsSelection,
    saveScript,
    saveVariable,
  },
};

function handleAction(event, actions) {
  const ignored = event.target.closest('[data-action-ignore]');
  if (ignored) return;

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
  const pendingToast = sessionStorage.getItem('pendingToast');
  const stack = document.getElementById('loading-stack');
  const placeholder = document.getElementById('loading-placeholder');
  const searchInput = document.querySelector('[data-action="filterScripts"]');

  try {
    const manifest = getManifestInfo();

    document.documentElement.lang = getLocale();
    document.title = manifest.name;

    applyTranslations();

    await initDB();
    await renderScripts();
    await renderLabels();
    await renderVariables();
    await initScratchpad();

    setTheme(userPreferences.theme);
    setViewMode(userPreferences.viewMode);
    setBackupReminder(userPreferences.backupReminder);

    toggleBackupBanner(state.hasUnsavedChanges);
    toggleLabelsSidebar(userPreferences.sidebars.labels);
    toggleScratchpadSidebar(userPreferences.sidebars.scratchpad);
    toggleVariablesSidebar(userPreferences.sidebars.variables);
  } catch (error) {
    console.error(error);

    placeholder.description = error.message;
    stack.show('error');

    return;
  }

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      document.body.removeAttribute('data-loading');
      searchInput?.focus();
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
  const debouncedToggleBackupBanner = debounce(
    () => toggleBackupBanner(state.hasUnsavedChanges),
    300
  );

  prefersDarkMode.addEventListener('change', () => {
    if (userPreferences.theme === 'system') setTheme('system');
  });

  window.addEventListener('beforeunload', warnBeforeUnload);

  document.addEventListener('click', (e) => handleAction(e, actions));
  document.addEventListener('change', (e) => handleAction(e, actions));
  document.addEventListener('input', (e) => handleAction(e, actions));
  document.addEventListener('submit', (e) => handleAction(e, actions));

  document.addEventListener('label:changed', renderScripts);

  ['data:changed', 'backup:completed'].forEach((event) => {
    document.addEventListener(event, () => {
      state.hasUnsavedChanges = event === 'data:changed';
      debouncedToggleBackupBanner();
    });
  });

  document.addEventListener('backupReminder:changed', () => {
    toggleBackupBanner(state.hasUnsavedChanges);
  });

  bindTooltipEvents();
  bindMenuEvents();
  bindDialogEvents();
}

bindEvents();
init();
