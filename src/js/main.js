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

import '/src/components/smb-dialog/smb-dialog.js';

import {
  clearField,
  closeDialog,
  openDialog,
  handleAction,
  handleShortcut,
  toggleSidebar,
} from './utils.js';

import {
  toggleLabelsSidebar,
  toggleVariablesSidebar,
  userPreferences,
} from './preferences.js';

import {
  KEYBOARD_SHORTCUTS,
} from './shortcuts.js';

const actions = {
  change: {
  },

  click: {
    clearField,
    closeDialog: (target) => closeDialog(target?.dataset?.target ?? target),
    openDialog: (target) => openDialog(target?.dataset?.target ?? target),
    toggleLabelsSidebar,
    toggleVariablesSidebar,
  },

  input: {
  },

  submit: {
  },
};

async function init() {
  toggleLabelsSidebar(userPreferences.sidebars.labels);
  toggleVariablesSidebar(userPreferences.sidebars.variables);
}

function bindEvents() {
  document.addEventListener('click', (e) => handleAction(e, actions));
  document.addEventListener('change', (e) => handleAction(e, actions));
  document.addEventListener('input', (e) => handleAction(e, actions));
  document.addEventListener('submit', (e) => handleAction(e, actions));
  document.addEventListener('keydown', (e) => handleShortcut(e, actions, KEYBOARD_SHORTCUTS));
}

bindEvents();
init();
