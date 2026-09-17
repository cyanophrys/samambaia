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

(() => {
  const LOOKBEHIND_CHARS = 64;

  let shortcuts = {};
  let textExpansion = true;
  let prefix = '';
  let trigger = '';
  let pendingShortcut = null;

  chrome.storage.local.get(['textExpansionShortcuts', 'userPreferences'], (result) => {
    shortcuts = result.textExpansionShortcuts ?? {};
    textExpansion = result.userPreferences?.textExpansion ?? true;
    prefix = result.userPreferences?.textExpansionPrefix ?? '';
    trigger = result.userPreferences?.textExpansionTrigger ?? '';
  });

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'local') return;

    if (changes.textExpansionShortcuts) {
      shortcuts = changes.textExpansionShortcuts.newValue ?? {};
    }

    if (changes.userPreferences) {
      textExpansion = changes.userPreferences.newValue?.textExpansion ?? true;
      prefix = changes.userPreferences.newValue?.textExpansionPrefix ?? '';
      trigger = changes.userPreferences.newValue?.textExpansionTrigger ?? '';
    }
  });

  function isNativeField(element) {
    return (
      (element instanceof HTMLInputElement &&
        /^(text|search|url|tel|email)$/.test(element.type)) ||
      element instanceof HTMLTextAreaElement
    );
  }

  function isEditableField(element) {
    return isNativeField(element) || element?.isContentEditable;
  }

  function getTextBeforeCaret(field, isNative) {
    if (isNative) return field.value.slice(0, field.selectionStart);

    const selection = window.getSelection();
    if (!selection?.rangeCount) return '';

    const range = selection.getRangeAt(0).cloneRange();
    range.collapse(true);
    range.setStart(field, 0);

    return range.toString();
  }

  function selectPrefix(field, isNative, prefixLength) {
    if (isNative) {
      field.setSelectionRange(
        field.selectionStart - prefixLength,
        field.selectionStart
      );
      return true;
    }

    const selection = window.getSelection();
    if (!selection?.rangeCount) return false;

    const range = selection.getRangeAt(0).cloneRange();
    if (!range.collapsed) return false;

    range.setStart(
      range.startContainer,
      Math.max(0, range.startOffset - prefixLength)
    );
    selection.removeAllRanges();
    selection.addRange(range);

    return true;
  }

  function getTriggerKey() {
    if (trigger === 'space') return ' ';
    if (trigger === 'tab') return 'Tab';
    if (trigger === 'enter') return 'Enter';

    return null;
  }

  document.addEventListener(
    'input',
    (event) => {
      pendingShortcut = null;

      if (!textExpansion || !prefix || !Object.keys(shortcuts).length) return;

      const field = event.target;
      if (!isEditableField(field)) return;

      const isNative = isNativeField(field);
      const textBeforeCaret = getTextBeforeCaret(field, isNative).slice(-LOOKBEHIND_CHARS);
      const escapedPrefix = prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const prefixPattern = new RegExp(
        `(?:^|\\s)${escapedPrefix}([a-zA-Z0-9_-]{1,32})$`
      );
      const match = textBeforeCaret.match(prefixPattern);
      if (!match) return;

      const shortcut = match[1].toLowerCase();
      if (shortcuts[shortcut] === undefined) return;

      pendingShortcut = {
        field,
        shortcut,
        isNative,
        prefixLength: match[1].length + prefix.length,
      };
    },
    true
  );

  document.addEventListener(
    'keydown',
    (event) => {
      if (!pendingShortcut) return;
      if (event.key !== getTriggerKey()) return;

      const {
        field,
        shortcut,
        isNative,
        prefixLength,
      } = pendingShortcut;

      if (event.target !== field) {
        pendingShortcut = null;
        return;
      }

      const replacement = shortcuts[shortcut];
      if (replacement === undefined) {
        pendingShortcut = null;
        return;
      }

      if (!selectPrefix(field, isNative, prefixLength)) {
        pendingShortcut = null;
        return;
      }

      pendingShortcut = null;

      event.preventDefault();
      document.execCommand('insertText', false, replacement);
    },
    true
  );
})();
