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
  DEFAULT_PREFERENCES,
} from './config.js';

import {
  toggleSidebar,
} from './utils.js';

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
