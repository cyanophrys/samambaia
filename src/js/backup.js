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
  hasStoredData,
  getAllLabels,
  getAllScripts,
  getAllVariables,
  getScratchpadData,
  restoreBackupFromFile,
} from './db.js';

import {
  getManifestInfo,
} from './utils.js';

import {
  state,
  resetState,
} from './state.js';

import {
  userPreferences,
} from './preferences.js';

import {
  BACKUP_SCHEMA_VERSION,
} from './config.js';

export function toggleBackupBanner(hasChanges) {
  const banner = document.getElementById('backup-banner');
  if (!banner) return;

  const isEnabled = userPreferences.backupReminder ?? true;

  banner.dataset.visible = String(hasChanges && isEnabled);
}

export function warnBeforeUnload(event) {
  const isEnabled = userPreferences.backupReminder ?? true;

  if (state.hasChanges && isEnabled) {
    event.preventDefault();
    event.returnValue = '';
  }
}

function confirmRestore() {
  const dialog = document.createElement('smb-alert-dialog');

  dialog.title = 'Replace existing data?';
  dialog.message = 'This will replace your existing data. This action cannot be undone.';

  dialog.addResponses([
    { id: 'cancel', label: 'Cancel', appearance: 'default' },
    { id: 'restore', label: 'Replace data', appearance: 'destructive' },
  ]);

  return new Promise((resolve) => {
    dialog.addEventListener('response', (event) => {
      resolve(event.detail.response === 'restore');
    }, { once: true });

    dialog.showModal();
  });
}

function formatTimestamp(date) {
  const pad = (value) => String(value).padStart(2, '0');

  const day = pad(date.getDate());
  const month = pad(date.getMonth() + 1);
  const year = date.getFullYear();
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  const seconds = pad(date.getSeconds());

  return `${day}-${month}-${year}_${hours}-${minutes}-${seconds}`;
}

function validateBackup(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data))
    return false;

  if (
    data.schemaVersion !== undefined &&
    (!Number.isInteger(data.schemaVersion) ||
      data.schemaVersion < 1 ||
      data.schemaVersion > BACKUP_SCHEMA_VERSION)
  ) {
    return false;
  }

  if (!Array.isArray(data.scripts))
    return false;

  if (!Array.isArray(data.labels))
    return false;

  if (
    data.preferences !== undefined &&
    (data.preferences === null ||
      typeof data.preferences !== 'object' ||
      Array.isArray(data.preferences))
  ) {
    return false;
  }

  if (data.variables !== undefined && !Array.isArray(data.variables))
    return false;

  for (const label of data.labels) {
    if (!label || typeof label !== 'object' || Array.isArray(label))
      return false;
  }

  for (const script of data.scripts) {
    if (!script || typeof script !== 'object' || Array.isArray(script))
      return false;

    if (script.labels !== undefined && !Array.isArray(script.labels))
      return false;
  }

  for (const variable of data.variables ?? []) {
    if (!variable || typeof variable !== 'object' || Array.isArray(variable))
      return false;
  }

  if (data.scratchpad !== undefined && typeof data.scratchpad !== 'string')
    return false;

  return true;
}

export async function exportBackup() {
  try {
    const scripts = await getAllScripts();
    const labels = await getAllLabels();
    const variables = await getAllVariables();
    const scratchpad = await getScratchpadData();
    const manifest = await getManifestInfo();
    const date = new Date();
    const timestamp = formatTimestamp(date);

    const data = JSON.stringify({
      schemaVersion: BACKUP_SCHEMA_VERSION,
      version: manifest.version,
      exportDate: timestamp,
      labels,
      scripts,
      variables,
      scratchpad,
      preferences: userPreferences,
    }, null, 2);

    const fileName = `backup_${timestamp}.json`;
    const blob = new Blob([data], { type: 'application/json' });

    if (window.showSaveFilePicker) {
      try {
        const handle = await window.showSaveFilePicker({
          suggestedName: fileName,
          types: [{
            description: 'JSON Files',
            accept: { 'application/json': ['.json'] },
          }],
        });

        const writable = await handle.createWritable();
        await writable.write(blob);
        await writable.close();

        state.hasChanges = false;
        document.dispatchEvent(new Event('backup:completed'));

        const toast = document.createElement('smb-toast');

        toast.message = 'Backup completed';
        toast.show('main-toast');
        return;
      } catch (err) {
        if (err.name !== 'AbortError') throw err;
        return;
      }
    }

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');

    a.href = url;
    a.download = fileName;

    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    state.hasChanges = false;
    document.dispatchEvent(new Event('backup:completed'));

    const toast = document.createElement('smb-toast');

    toast.message = 'Backup completed';
    toast.show('main-toast');
  } catch (error) {
    console.error(error);

    const toast = document.createElement('smb-toast');

    toast.message = 'Backup failed';
    toast.show('main-toast');
  }
}

export async function restoreBackup() {
  try {
    let file;

    if (window.showOpenFilePicker) {
      try {
        const [handle] = await window.showOpenFilePicker({
          types: [{
            description: 'JSON Files',
            accept: { 'application/json': ['.json'] },
          }],
        });

        file = await handle.getFile();
      } catch (err) {
        if (err.name !== 'AbortError') throw err;
        return;
      }
    } else {
      file = await new Promise((resolve) => {
        const input = document.createElement('input');

        input.type = 'file';
        input.accept = 'application/json,.json';
        input.onchange = (event) => resolve(event.target.files?.[0] ?? null);
        input.click();
      });

      if (!file) return;
    }

    const text = await file.text();
    const data = JSON.parse(text);

    if (!validateBackup(data))
      throw new Error('Invalid file format');

    if (await hasStoredData()) {
      const confirmed = await confirmRestore();

      if (!confirmed)
        return;
    }

    await restoreBackupFromFile({
      labels: data.labels,
      scripts: data.scripts,
      variables: data.variables ?? [],
      scratchpad: data.scratchpad,
    });

    if (data.preferences)
      Object.assign(userPreferences, data.preferences);

    resetState();

    sessionStorage.setItem('pendingToast', 'Restore completed');
    window.location.reload();
  } catch (error) {
    console.error(error);
    const toast = document.createElement('smb-toast');

    toast.message = 'Restore failed. Check that the file is valid.';
    toast.show('main-toast');
  }
}
