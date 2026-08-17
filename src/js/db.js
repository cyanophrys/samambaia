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

const DB_NAME = 'SamambaiaDB';
const DB_VERSION = 1;
const SCRIPTS_STORE = 'scripts';
const LABELS_STORE = 'labels';

let db;

export function initDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);

    request.onsuccess = () => {
      db = request.result;

      db.onversionchange = () => {
        db.close();
        db = undefined;
      };

      resolve(db);
    };

    request.onupgradeneeded = () => {
      const database = request.result;

      if (!database.objectStoreNames.contains(SCRIPTS_STORE)) {
        database.createObjectStore(SCRIPTS_STORE, {
          keyPath: 'id',
          autoIncrement: true,
        });
      }

      if (!database.objectStoreNames.contains(LABELS_STORE)) {
        database.createObjectStore(LABELS_STORE, {
          keyPath: 'id',
          autoIncrement: true,
        });
      }
    };
  });
}

export async function wipeDB() {
  if (db) {
    db.close();
    db = undefined;
  }

  await new Promise((resolve, reject) => {
    const request = indexedDB.deleteDatabase('SamambaiaDB');
    request.onsuccess = resolve;
    request.onerror = () => reject(request.error);
    request.onblocked = resolve;
  });
}

export function getAllScripts() {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(SCRIPTS_STORE, 'readonly');
    const store = transaction.objectStore(SCRIPTS_STORE);
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export function getScript(id) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(SCRIPTS_STORE, 'readonly');
    const store = transaction.objectStore(SCRIPTS_STORE);
    const request = store.get(id);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export function saveScriptData(script) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(SCRIPTS_STORE, 'readwrite');
    const store = transaction.objectStore(SCRIPTS_STORE);

    const data = {
      ...script,
    };

    if (data.id == null || data.id === '') {
      delete data.id;
    } else {
      data.id = Number(data.id);
    }

    const request = data.id == null
      ? store.add(data)
      : store.put(data);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export function deleteScriptData(id) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(SCRIPTS_STORE, 'readwrite');
    const store = transaction.objectStore(SCRIPTS_STORE);
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export function getAllLabels() {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(LABELS_STORE, 'readonly');
    const store = transaction.objectStore(LABELS_STORE);
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export function getLabel(id) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(LABELS_STORE, 'readonly');
    const store = transaction.objectStore(LABELS_STORE);
    const request = store.get(id);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export function saveLabelData(label) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(LABELS_STORE, 'readwrite');
    const store = transaction.objectStore(LABELS_STORE);

    const data = { ...label };

    if (data.id == null || data.id === '') {
      delete data.id;
    } else {
      data.id = Number(data.id);
    }

    const request = data.id == null
      ? store.add(data)
      : store.put(data);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export function deleteLabelData(id) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(LABELS_STORE, 'readwrite');
    const store = transaction.objectStore(LABELS_STORE);
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}
