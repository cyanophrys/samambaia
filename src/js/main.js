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

import '../components/smb-alert-dialog/smb-alert-dialog.js';
import '../components/smb-dialog/smb-dialog.js';
import '../components/smb-stack/smb-stack.js';
import '../components/smb-toast/smb-toast.js';

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
  wipeStoredData,
} from './store.js';

import {
  state,
} from './state.js';

import {
  setAccentColor,
  setBackupReminder,
  setHighContrast,
  setTheme,
  setLargeText,
  setRecentScripts,
  setViewMode,
  toggleLabelsSidebar,
  toggleScratchpadSidebar,
  toggleVariablesSidebar,
  userPreferences,
} from './preferences.js';

import {
  initDB,
  wipeDB,
} from './db.js';

import {
  addScript,
  clearRecentScripts,
  copyScript,
  deleteScript,
  editScript,
  filterByLabel,
  filterScripts,
  initScriptsSortable,
  moveScriptNext,
  moveScriptPrevious,
  renderScripts,
  saveScript,
  saveScriptsOrder,
  scrollScriptsView,
  searchAllScripts,
  toggleFavoriteScript,
  updateScriptMoveButtons,
} from './scripts.js';

import {
  addLabel,
  deleteLabel,
  editLabel,
  filterScriptLabels,
  openLabelsSelectionDialog,
  renderLabels,
  saveLabel,
  toggleScriptLabel,
  togglePinLabel,
} from './labels.js';

import {
  addVariable,
  deleteVariable,
  editVariable,
  handleVariableValueInput,
  renderVariables,
  saveVariable,
  togglePinVariable,
} from './variables.js';

import {
  copyScratchpad,
  clearScratchpad,
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
  applyAriaKeyshortcuts,
  applyShortcutDisplays,
  KEYBOARD_SHORTCUTS,
} from './shortcuts.js';

import {
  bindTooltipEvents,
} from './tooltip.js';

import {
  bindMenuBehaviors,
} from './menu.js';

import {
  applyTranslations,
  t,
} from './i18n.js';

const actions = {
  change: {
    setAccentColor,
    setBackupReminder,
    setHighContrast,
    setLargeText,
    setRecentScripts,
    setTheme,
    syncFormControlState,
    toggleScriptLabel,
  },

  click: {
    addLabel,
    addScript,
    addVariable,
    clearField,
    clearRecentScripts,
    clearScratchpad,
    closeDialog: (target) => closeDialog(target?.dataset?.target ?? target),
    copyScratchpad,
    copyScript,
    deleteLabel,
    deleteScript,
    deleteVariable,
    editLabel,
    editScript,
    editVariable,
    exportBackup,
    filterByLabel: (target) => filterByLabel(target),
    moveScriptNext,
    moveScriptPrevious,
    openAboutDialog,
    openDialog: (target) => openDialog(target?.dataset?.target ?? target),
    openLabelsSelectionDialog,
    openSettingsDialog: (target) => openSettingsDialog(target?.dataset?.page),
    restoreBackup,
    scrollScriptsView,
    searchAllScripts,
    setViewMode,
    toggleFavoriteScript,
    toggleLabelsSidebar,
    togglePinLabel,
    togglePinVariable,
    toggleScratchpadSidebar,
    toggleVariablesSidebar,
    wipeData,
  },

  input: {
    filterScripts,
    filterScriptLabels,
    handleVariableValueInput,
    handleScratchpadInput,
  },

  submit: {
    saveLabel,
    saveScript,
    saveVariable,
  },
};

async function init() {
  const pendingToast = sessionStorage.getItem('pendingToast');
  const manifest = await getManifestInfo();

  document.title = manifest.name;
  document.documentElement.lang = chrome.i18n.getUILanguage();

  applyTranslations();

  await initDB();
  await renderScripts();
  await renderLabels();
  await renderVariables();
  await initScratchpad();
  initScriptsSortable();

  applyShortcutDisplays();
  applyAriaKeyshortcuts();

  setAccentColor(userPreferences.accentColor);
  setBackupReminder(userPreferences.backupReminder);
  setHighContrast(userPreferences.highContrast);
  setLargeText(userPreferences.largeText);
  setRecentScripts(userPreferences.recentScripts);
  setTheme(userPreferences.theme);
  setViewMode(userPreferences.viewMode);

  toggleBackupBanner(state.hasChanges);
  toggleLabelsSidebar(userPreferences.sidebars.labels);
  toggleScratchpadSidebar(userPreferences.sidebars.scratchpad);
  toggleVariablesSidebar(userPreferences.sidebars.variables);

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

  window.addEventListener('beforeunload', warnBeforeUnload);

  document.addEventListener('click', (e) => handleAction(e, actions));
  document.addEventListener('change', (e) => handleAction(e, actions));
  document.addEventListener('input', (e) => handleAction(e, actions));
  document.addEventListener('submit', (e) => handleAction(e, actions));
  document.addEventListener('keydown', (e) => handleShortcut(e, actions, KEYBOARD_SHORTCUTS));

  bindTooltipEvents();
  bindMenuBehaviors();

  document.addEventListener('label:changed', renderScripts);
  document.addEventListener('recentScripts:changed', filterScripts);

  ['data:changed', 'backup:completed'].forEach((event) => {
    document.addEventListener(event, () => {
      state.hasChanges = event === 'data:changed';
      toggleBackupBanner(state.hasChanges);
    });
  });

  document.addEventListener('backupReminder:changed', () => {
    toggleBackupBanner(state.hasChanges);
  });

  document.addEventListener('sort:changed', () => {
    updateScriptMoveButtons();
    saveScriptsOrder();
  });
}

function openSettingsDialog(page = 'appearance') {
  const dialog = document.getElementById('settings-dialog');
  const stack = dialog.querySelector('smb-stack');

  stack.show(page);
  openDialog(dialog);
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

async function wipeData() {
  const dialog = document.createElement('smb-alert-dialog');

  dialog.title = t('deleteAllDataTitle');
  dialog.message = t('deleteAllDataMessage');

  const confirmation = document.createElement('label');
  confirmation.className = "label";
  confirmation.innerHTML = `
    <input type="checkbox" class="checkbox" name="wipe-confirmation">
    <span>${t('wipeConfirmationLabel')}</span>
  `;
  confirmation.slot = 'additional-content';

  dialog.append(confirmation);

  dialog.addResponses([
    { id: 'cancel', label: t('cancel'), appearance: 'default' },
    { id: 'wipe', label: t('deleteData'), appearance: 'destructive' }
  ]);

  dialog.setResponseEnabled('wipe', false);

  const checkbox = confirmation.querySelector('input');

  checkbox.addEventListener('change', () => {
    dialog.setResponseEnabled('wipe', checkbox.checked);
  });

  dialog.addEventListener('response', async (e) => {
    if (e.detail.response !== 'wipe') return;

    try {
      await wipeStoredData();
      await wipeDB();

      state.hasChanges = false;

      sessionStorage.setItem('pendingToast', t('dataDeleted'));

      window.location.reload();
    } catch (error) {
      console.error(error);

      const toast = document.createElement('smb-toast');

      toast.type = 'error';
      toast.message = t('errorDeletingData');
      toast.show('main-toast');
    }
  }, { once: true });

  dialog.showModal();
}

bindEvents();
init();
