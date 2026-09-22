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
import '../components/smb-placeholder/smb-placeholder.js';
import '../components/smb-search/smb-search.js';
import '../components/smb-stack-page/smb-stack-page.js';
import '../components/smb-stack/smb-stack.js';
import '../components/smb-stack-switcher/smb-stack-switcher.js';
import '../components/smb-stack-tab/smb-stack-tab.js';
import '../components/smb-toast/smb-toast.js';

import {
  debounce,
  suppressTransitions,
} from './utils.js';

import {
  wipeStoredData,
} from './store.js';

import {
  state,
} from './state.js';

import {
  openPreferencesDialog,
  setAccentColor,
  setBackupReminder,
  setHighContrast,
  setTheme,
  setLargeText,
  setRecentScripts,
  setTextExpansion,
  setTextExpansionPrefix,
  setTextExpansionTrigger,
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
  focusScriptsSearch,
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
  updateTextExpansionShortcuts,
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
  expandScratchpad,
  handleScratchpadInput,
  initScratchpad,
} from './scratchpad.js';

import {
  dismissBackupBanner,
  exportBackup,
  restoreBackup,
  toggleBackupBanner,
  warnBeforeUnload,
} from './backup.js';

import {
  applyAriaKeyshortcuts,
  applyShortcutDisplays,
  filterShortcuts,
  handleShortcut,
  KEYBOARD_SHORTCUTS,
  openShortcutsDialog,
} from './shortcuts.js';

import {
  getManifestInfo,
  openAboutDialog,
} from './about.js';

import {
  bindTooltipEvents,
} from './tooltip.js';

import {
  bindMenuBehaviors,
} from './menu.js';

import {
  bindDialogEvents,
} from './dialog.js';

import {
  applyTranslations,
  getLocale,
  t,
} from './i18n.js';

const actions = {
  change: {
    setAccentColor,
    setBackupReminder,
    setHighContrast,
    setLargeText,
    setRecentScripts,
    setTextExpansion,
    setTextExpansionPrefix,
    setTextExpansionTrigger,
    setTheme,
    toggleScriptLabel,
  },

  click: {
    addLabel,
    addScript,
    addVariable,
    clearRecentScripts,
    clearScratchpad,
    copyScratchpad,
    copyScript,
    deleteLabel,
    deleteScript,
    deleteVariable,
    dismissBackupBanner,
    editLabel,
    editScript,
    editVariable,
    expandScratchpad,
    exportBackup,
    filterByLabel: (target) => filterByLabel(target),
    focusScriptsSearch,
    moveScriptNext,
    moveScriptPrevious,
    openAboutDialog,
    openLabelsSelectionDialog,
    openPreferencesDialog: (target) => openPreferencesDialog(target?.dataset?.page),
    openShortcutsDialog,
    restoreBackup,
    reload: () => window.location.reload(),
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
    filterShortcuts,
    filterScripts: debounce(filterScripts, 150),
    filterScriptLabels: debounce(filterScriptLabels, 150),
    handleVariableValueInput,
    handleScratchpadInput,
  },

  submit: {
    saveLabel,
    saveScript,
    saveVariable,
  },
};

function handleAction(event, actions) {
  const ignored = event.target.closest('[data-action-ignore]');
  if (ignored) return;

  const element = event.target.closest('[data-action]');
  if (!element) return;

  const { action, target } = element.dataset;
  const eventType = event.type;

  const handler = actions[eventType]?.[action];
  if (!handler) return;

  if (event.type === 'submit') event.preventDefault();

  const param = eventType === 'change' ? event.target.value : element;
  handler(param, event, element);
}

async function init() {
  const pendingToast = sessionStorage.getItem('pendingToast');
  const loading = document.getElementById('loading');
  const spinner = loading?.querySelector('.spinner');
  const placeholder = loading?.querySelector('smb-placeholder');
  const errorDetails = loading?.querySelector('code');
  const searchInput = document.getElementById('scripts-search-input');

  try {
    const manifest = await getManifestInfo();

    document.title = manifest.name;
    document.documentElement.lang = await getLocale();

    applyTranslations();

    await initDB();
    await renderLabels();
    await renderVariables();
    await renderScripts();
    await initScratchpad();
    initScriptsSortable();

    applyShortcutDisplays();
    applyAriaKeyshortcuts();

    suppressTransitions(() => {
      setAccentColor(userPreferences.accentColor);
      setBackupReminder(userPreferences.backupReminder);
      setHighContrast(userPreferences.highContrast);
      setLargeText(userPreferences.largeText);
      setRecentScripts(userPreferences.recentScripts);
      setTextExpansion(userPreferences.textExpansion);
      setTextExpansionPrefix(userPreferences.textExpansionPrefix);
      setTextExpansionTrigger(userPreferences.textExpansionTrigger);
      setTheme(userPreferences.theme);
      setViewMode(userPreferences.viewMode);

      toggleBackupBanner(state.hasChanges);
      toggleLabelsSidebar(userPreferences.sidebars.labels);
      toggleScratchpadSidebar(userPreferences.sidebars.scratchpad);
      toggleVariablesSidebar(userPreferences.sidebars.variables);
    });
  } catch (error) {
    console.error(error);

    spinner?.setAttribute('hidden', '');
    placeholder?.removeAttribute('hidden');

    if (errorDetails)
      errorDetails.textContent = error.message;

    return;
  }

  loading?.setAttribute('hidden', '');

  requestAnimationFrame(() => {
    document.body.classList.remove('hidden');
    searchInput?.focus();
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
    () => toggleBackupBanner(state.hasChanges),
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
  document.addEventListener('keydown', (e) => handleShortcut(e, actions, KEYBOARD_SHORTCUTS));

  bindTooltipEvents();
  bindMenuBehaviors();
  bindDialogEvents();

  document.addEventListener('recentScripts:changed', filterScripts);
  document.addEventListener('variable:changed', updateTextExpansionShortcuts);

  ['label:changed', 'textExpansionPrefix:changed'].forEach((event) => {
    document.addEventListener(event, renderScripts);
  });

  ['data:changed', 'backup:completed'].forEach((event) => {
    document.addEventListener(event, () => {
      state.hasChanges = event === 'data:changed';

      if (event === 'data:changed')
        state.backupBannerDismissed = false;

      debouncedToggleBackupBanner();
    });
  });

  document.addEventListener('backupReminder:changed', debouncedToggleBackupBanner);

  document.addEventListener('sort:changed', () => {
    updateScriptMoveButtons();
    saveScriptsOrder();
  });
}

async function wipeData() {
  const dialog = document.createElement('smb-alert-dialog');

  dialog.heading = t('deleteAllDataHeading');
  dialog.body = t('deleteAllDataBody');

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
      const { mainTabId } = await chrome.storage.local.get('mainTabId');

      await wipeStoredData(mainTabId !== undefined ? { mainTabId } : {});
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
