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

const DEFAULT_STATE = {
  hasChanges: false,
  selectedLabel: 'all',
  recentScripts: [],
};

export const state = createStore(
  await loadState('state', DEFAULT_STATE),
  {
    storageKey: 'state'
  }
);

export async function resetState() {
  Object.assign(state, structuredClone(DEFAULT_STATE));
}
