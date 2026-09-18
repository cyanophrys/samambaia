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

function getTextareas() {
  return document.querySelectorAll('[data-action="handleScratchpadInput"]');
}

function getPrimaryTextarea() {
  return getTextareas()[0];
}

function getToastTarget() {
  const dialog = document.getElementById('scratchpad-dialog');

  return dialog?.open
    ? 'scratchpad-dialog-toast'
    : 'main-toast';
}

function updateScratchpadButtons() {
  const disabled = !getPrimaryTextarea()?.value.trim();

  document.querySelectorAll(
    '[data-action="copyScratchpad"], [data-action="clearScratchpad"]'
  ).forEach(button => {
    button.disabled = disabled;
  });
}

function broadcastScratchpad(text) {
  document.dispatchEvent(new CustomEvent('scratchpad:changed', {
    detail: text,
  }));
}

function updateScratchpadTextareas(text) {
  getTextareas().forEach(textarea => {
    if (textarea.value !== text)
      textarea.value = text;
  });

  updateScratchpadButtons();
}

document.addEventListener('scratchpad:changed', event => {
  updateScratchpadTextareas(event.detail);
});

export async function initScratchpad() {
  const textareas = getTextareas();

  if (!textareas.length) return;

  try {
    const content = await getScratchpadData();

    if (typeof content !== 'string') {
      updateScratchpadTextareas('');
      return;
    }

    updateScratchpadTextareas(content.slice(0, MAX_SCRATCHPAD_LENGTH));
  } catch (error) {
    console.error(error);
  }
}

export function handleScratchpadInput(value, event) {
  const textarea = event?.target;

  if (!textarea) return;

  if (textarea.value.length > MAX_SCRATCHPAD_LENGTH)
    textarea.value = textarea.value.slice(0, MAX_SCRATCHPAD_LENGTH);

  broadcastScratchpad(textarea.value);
  debouncedSaveScratchpad(textarea.value);
}

export async function copyScratchpad() {
  const textarea = getPrimaryTextarea();

  if (!textarea || !textarea.value.trim()) return;

  const toast = document.createElement('smb-toast');

  try {
    await navigator.clipboard.writeText(textarea.value);

    toast.message = t('copiedToClipboard');
  } catch (error) {
    console.error(error);

    toast.message = t('copyToClipboardError');
  }

  toast.show(getToastTarget());
}

export async function clearScratchpad() {
  const textarea = getPrimaryTextarea();

  if (!textarea || !textarea.value.trim()) return;

  const previousContent = textarea.value;
  const toastTarget = getToastTarget();

  try {
    await clearScratchpadData();

    broadcastScratchpad('');

    const toast = document.createElement('smb-toast');

    toast.duration = 10000;
    toast.message = t('scratchpadCleared');
    toast.addAction(t('undo'), async () => {
      try {
        await saveScratchpadData(previousContent);

        broadcastScratchpad(previousContent);
      } catch (error) {
        console.error(error);
      }
    });

    toast.show(toastTarget);
  } catch (error) {
    console.error(error);
  }
}

export function expandScratchpad() {
  const dialog = document.getElementById('scratchpad-dialog');

  if (!dialog) return;

  dialog.showModal();
}
