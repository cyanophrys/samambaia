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
  getScratchpadData,
  saveScratchpadData,
  clearScratchpadData,
} from './db.js';

import {
  debounce,
} from './utils.js';

import {
  t,
} from './i18n.js';

const MAX_SCRATCHPAD_LENGTH = 10000;

const debouncedSaveScratchpad = debounce(async text => {
  try {
    await saveScratchpadData(text);
  } catch (error) {
    console.error(error);
  }
}, 500);

function updateScratchpadButtons() {
  const textarea = document.querySelector('[data-action="handleScratchpadInput"]');
  const copyButton = document.querySelector('[data-action="copyScratchpad"]');
  const clearButton = document.querySelector('[data-action="clearScratchpad"]');
  const disabled = !textarea?.value.trim();

  if (copyButton)
    copyButton.disabled = disabled;

  if (clearButton)
    clearButton.disabled = disabled;
}

export async function initScratchpad() {
  const textarea = document.querySelector('[data-action="handleScratchpadInput"]');

  if (!textarea) return;

  try {
    const content = await getScratchpadData();

    if (typeof content !== 'string') {
      textarea.value = '';
      updateScratchpadButtons();
      return;
    }

    textarea.value = content.slice(0, MAX_SCRATCHPAD_LENGTH);
    updateScratchpadButtons();
  } catch (error) {
    console.error(error);
  }
}

export function handleScratchpadInput(value, event) {
  const textarea = event?.target;

  if (!textarea) return;

  if (textarea.value.length > MAX_SCRATCHPAD_LENGTH)
    textarea.value = textarea.value.slice(0, MAX_SCRATCHPAD_LENGTH);

  updateScratchpadButtons();

  debouncedSaveScratchpad(textarea.value);
}

export async function copyScratchpad() {
  const textarea = document.querySelector('[data-action="handleScratchpadInput"]');

  if (!textarea || !textarea.value.trim()) return;

  try {
    await navigator.clipboard.writeText(textarea.value);

    const toast = document.createElement('smb-toast');

    toast.message = t('copiedToClipboard');
    toast.show('main-toast');
  } catch (error) {
    console.error(error);
  }
}

export async function clearScratchpad() {
  const textarea = document.querySelector('[data-action="handleScratchpadInput"]');

  if (!textarea || !textarea.value.trim()) return;

  const previousContent = textarea.value;

  try {
    await clearScratchpadData();

    textarea.value = '';
    updateScratchpadButtons();

    const toast = document.createElement('smb-toast');

    toast.duration = 10000;
    toast.message = t('scratchpadCleared');
    toast.addAction(t('undo'), async () => {
      try {
        await saveScratchpadData(previousContent);

        textarea.value = previousContent;
        updateScratchpadButtons();
      } catch (error) {
        console.error(error);
      }
    });

    toast.show('main-toast');
  } catch (error) {
    console.error(error);
  }
}
