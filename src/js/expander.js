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
  const TRIGGER_PATTERN = /(?:^|\s)\/([a-zA-Z0-9_-]{1,32})$/;
  const LOOKBEHIND_CHARS = 64;

  let shortcuts = {};
  let textExpansion = true;

  chrome.storage.local.get(['scriptShortcuts', 'userPreferences'], (result) => {
    shortcuts = result.scriptShortcuts ?? {};
    textExpansion = result.userPreferences?.textExpansion ?? true;
  });

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'local') return;

    if (changes.scriptShortcuts) {
      shortcuts = changes.scriptShortcuts.newValue ?? {};
    }

    if (changes.userPreferences) {
      textExpansion = changes.userPreferences.newValue?.textExpansion ?? true;
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

  function selectTrigger(field, isNative, triggerLength) {
    if (isNative) {
      field.setSelectionRange(field.selectionStart - triggerLength, field.selectionStart);
      return true;
    }

    const selection = window.getSelection();
    if (!selection?.rangeCount) return false;

    const range = selection.getRangeAt(0).cloneRange();
    if (!range.collapsed) return false;

    range.setStart(range.startContainer, Math.max(0, range.startOffset - triggerLength));
    selection.removeAllRanges();
    selection.addRange(range);

    return true;
  }

  document.addEventListener(
    'input',
    (event) => {
      if (!textExpansion || !Object.keys(shortcuts).length) return;

      const field = event.target;
      if (!isEditableField(field)) return;

      const isNative = isNativeField(field);
      const textBeforeCaret = getTextBeforeCaret(field, isNative).slice(-LOOKBEHIND_CHARS);
      const match = textBeforeCaret.match(TRIGGER_PATTERN);
      if (!match) return;

      const replacement = shortcuts[match[1].toLowerCase()];
      if (replacement === undefined) return;

      if (!selectTrigger(field, isNative, match[1].length + 1)) return;

      document.execCommand('insertText', false, replacement);
    },
    true
  );
})();
