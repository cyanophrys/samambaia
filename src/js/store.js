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

const storage = globalThis.browser?.storage ?? globalThis.chrome?.storage;

if (!storage?.local) {
  throw new Error('Extension storage API is unavailable.');
}

export async function loadState(storageKey, defaultState) {
  if (!storageKey) return structuredClone(defaultState);

  try {
    const result = await storage.local.get(storageKey);
    return {
      ...structuredClone(defaultState),
      ...(result[storageKey] ?? {})
    };
  } catch (error) {
    console.error(`Failed to load state for key "${storageKey}":`, error);
    return structuredClone(defaultState);
  }
}

export function createStore(initialState, options = {}, onUpdate) {
  const proxyCache = new WeakMap();

  function saveState() {
    if (!options.storageKey) return;

    storage.local
      .set({
        [options.storageKey]: initialState
      })
      .catch((error) => {
        console.error(
          `Failed to save state for key "${options.storageKey}":`,
          error
        );
      });
  }

  function makeProxy(target, path = []) {
    if (!target || typeof target !== 'object') {
      return target;
    }

    if (proxyCache.has(target)) {
      return proxyCache.get(target);
    }

    const proxy = new Proxy(target, {
      get(target, property) {
        const value = target[property];

        if (
          value &&
          typeof value === 'object' &&
          !Array.isArray(value)
        ) {
          return makeProxy(value, [...path, property]);
        }

        return value;
      },

      set(target, property, value) {
        target[property] = value;

        saveState();

        onUpdate?.({
          path: [...path, property],
          value,
          state: initialState
        });

        return true;
      },

      deleteProperty(target, property) {
        delete target[property];

        saveState();

        onUpdate?.({
          path: [...path, property],
          value: undefined,
          state: initialState
        });

        return true;
      }
    });

    proxyCache.set(target, proxy);

    return proxy;
  }

  return makeProxy(initialState);
}
