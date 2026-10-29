/**
 * Samambaia - A simple scripts manager.
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
  deleteVariableData,
  getAllVariables,
  getVariable,
  saveVariableData,
} from './db.js';

import {
  applyTranslations,
  t,
} from './i18n.js';

import {
  INVALID_TOKEN_CHARS_PATTERN,
  NAME_TOKEN_PATTERN,
} from './config.js';

import {
  getColor,
} from './colors.js';

import {
  createShortcutDisplay,
} from './shortcuts.js';

const MAX_VARIABLE_NAME_LENGTH = 128;

let cachedVariables = [];
let debounceTimeout = null;
let variableItemTemplate = null;

function getVariableItemTemplate() {
  if (!variableItemTemplate) {
    variableItemTemplate = document.getElementById('variable-item-template');
    applyTranslations(variableItemTemplate.content);
  }

  return variableItemTemplate;
}

export function getVariableValuesMap() {
  const values = new Map();

  cachedVariables.forEach(variable => {
    if (variable.name && variable.value) values.set(variable.name, variable.value);
  });

  return values;
}

export async function renderVariables() {
  const pinnedContainer = document.getElementById('pinned-variables-container');
  const container = document.getElementById('variables-container');
  const stack = document.getElementById('variables-stack');
  const variables = await getAllVariables();

  cachedVariables = variables;

  variables.sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
  );

  const pinned = variables.filter(variable => variable.pinned);
  const unpinned = variables.filter(variable => !variable.pinned);

  pinnedContainer.hidden = pinned.length === 0;

  pinnedContainer.replaceChildren(
    ...pinned.map(createVariableElement)
  );

  container.replaceChildren(
    ...unpinned.map(createVariableElement)
  );

  stack?.show(
    variables.length === 0 ? 'empty-variables' : 'variables-list'
  );
}

export function createVariableElement(variable) {
  const template = getVariableItemTemplate();
  const item = template.content.firstElementChild.cloneNode(true);

  item.dataset.target = variable.id;
  item.dataset.pinned = variable.pinned ? 'true' : 'false';
  item.dataset.itemColor = getColor(variable.color);

  const input = item.querySelector('input');
  const label = item.querySelector('label');
  const moreButton = item.querySelector('[aria-haspopup]');
  const menu = item.querySelector('.menu');
  const menuItems = menu.querySelectorAll('.menu-item');
  const editButton = item.querySelector('[data-action="editVariable"]');
  const deleteButton = item.querySelector('[data-action="deleteVariable"]');
  const pinButton = item.querySelector('[data-action="togglePinVariable"]');
  const pinLabel = pinButton.querySelector('span');

  const inputId = `var-input-${variable.id}`;
  const menuId = `variable-menu-${variable.id}`;
  const anchorName = `--variable-menu-${variable.id}`;

  input.id = inputId;
  input.dataset.name = variable.name;
  input.dataset.target = variable.id;
  input.value = variable.value ?? '';

  label.htmlFor = inputId;
  label.textContent = `{{${variable.name}}}`;

  moreButton.setAttribute('popovertarget', menuId);
  moreButton.style.anchorName = anchorName;

  menu.id = menuId;
  menu.style.positionAnchor = anchorName;
  menu.setAttribute('aria-label', t('optionsFor', [variable.name]));

  menuItems.forEach((menuItem) => {
    const shortcut = menuItem.dataset.keyboardShortcut;

    if (!shortcut) return;

    const display = createShortcutDisplay(shortcut);
    display.classList.add('suffix');

    menuItem.append(display);
  });

  pinButton.setAttribute('popovertarget', menuId);
  pinButton.dataset.target = variable.id;
  pinLabel.textContent = variable.pinned
    ? t('unpin')
    : t('pin');

  editButton.setAttribute('popovertarget', menuId);
  editButton.dataset.target = variable.id;

  deleteButton.setAttribute('popovertarget', menuId);
  deleteButton.dataset.target = variable.id;

  return item;
}

export function addVariable() {
  const dialog = document.getElementById('variable-dialog');
  const form = dialog.querySelector('form');
  const saveButton = dialog.querySelector('button[type="submit"]');

  form.reset();
  form.elements['id'].value = '';

  dialog.heading = t('addVariable');
  dialog.subtitle = '';

  if (saveButton)
    saveButton.textContent = t('add');

  dialog.showModal();
}

export async function editVariable(element) {
  const id = Number(element.dataset.target);
  if (Number.isNaN(id)) return;

  const variable = await getVariable(id);
  if (!variable) return;

  const dialog = document.getElementById('variable-dialog');
  const form = dialog.querySelector('form');
  const saveButton = dialog.querySelector('button[type="submit"]');

  form.elements['id'].value = variable.id;
  form.elements['name'].value = variable.name;
  form.elements['value'].value = variable.value ?? '';
  form.elements['color'].value = getColor(variable.color);

  dialog.heading = t('editVariable');
  dialog.subtitle = variable.name;

  if (saveButton)
    saveButton.textContent = t('edit');

  dialog.showModal();
}

export async function saveVariable() {
  const dialog = document.getElementById('variable-dialog');
  const form = dialog.querySelector('form');
  const id = form.elements['id'].value ? Number(form.elements['id'].value) : undefined;
  const rawName = form.elements['name'].value.trim();
  const name = rawName.replace(INVALID_TOKEN_CHARS_PATTERN, '');
  const value = form.elements['value'].value;
  const color = getColor(form.elements['color'].value);

  if (!rawName) return;

  if (rawName !== name) {
    const toast = document.createElement('smb-toast');

    toast.message = t('variableNameInvalid');
    toast.show('variable-dialog-toast');
    return;
  }

  if (name.length > MAX_VARIABLE_NAME_LENGTH) {
    const toast = document.createElement('smb-toast');

    toast.message = t('variableNameTooLong', String(MAX_VARIABLE_NAME_LENGTH));
    toast.show('variable-dialog-toast');
    return;
  }

  const variables = await getAllVariables();
  const isDuplicate = variables.some(variable =>
    variable.name.toLowerCase() === name.toLowerCase() && variable.id !== id
  );

  if (isDuplicate) {
    const toast = document.createElement('smb-toast');

    toast.message = t('variableDuplicate');
    toast.show('variable-dialog-toast');
    return;
  }

  const existingVariable = variables.find(variable => variable.id === id);
  const variableData = existingVariable
    ? { ...existingVariable, name, value, color }
    : { id, name, value, color };

  await saveVariableData(variableData);

  dialog.close();

  await renderVariables();
  document.dispatchEvent(new Event('variable:changed'));

  const message = t(id ? 'variableEdited' : 'variableAdded', [name]);
  const toast = document.createElement('smb-toast');

  toast.message = message;
  toast.show('main-toast');
}

export async function deleteVariable(element) {
  const id = Number(element.dataset.target);
  if (Number.isNaN(id)) return;

  const variable = await getVariable(id);
  if (!variable) return;

  const dialog = document.createElement('smb-alert-dialog');

  dialog.heading = t('deleteVariableHeading');
  dialog.body = t('deleteVariableBody', [variable.name]);

  dialog.addResponses([
    {
      id: 'cancel',
      label: t('cancel'),
      appearance: 'default',
    },
    {
      id: 'delete',
      label: t('deleteVariable'),
      appearance: 'destructive',
    },
  ]);

  dialog.addEventListener('response', async (event) => {
    if (event.detail.response === 'delete') {
      await deleteVariableData(id);
      await renderVariables();
      document.dispatchEvent(new Event('variable:changed'));

      const toast = document.createElement('smb-toast');

      toast.message = t('variableDeleted', [variable.name]);
      toast.show('main-toast');
    }
  }, { once: true });

  dialog.showModal();
}

export function handleVariableValueInput(value, event) {
  const input = event?.target;
  const id = Number(input?.dataset.target);

  if (Number.isNaN(id)) return;

  const variable = cachedVariables.find(variable => variable.id === id);

  if (!variable) return;

  variable.value = input.value;

  clearTimeout(debounceTimeout);

  const variableData = {
    ...variable,
  };

  debounceTimeout = setTimeout(async () => {
    try {
      await saveVariableData(variableData);
      document.dispatchEvent(new Event('variable:changed'));
    } catch (error) {
      console.error(error);
    }
  }, 500);
}

export function applyVariables(content, values = getVariableValuesMap()) {
  return content.replace(NAME_TOKEN_PATTERN, (match, name) =>
    values.has(name) ? values.get(name) : match
  );
}

export async function togglePinVariable(target) {
  const id = Number(target.dataset.target);
  if (Number.isNaN(id)) return;

  const variable = await getVariable(id);
  if (!variable) return;

  const isPinned = !variable.pinned;

  await saveVariableData({ ...variable, pinned: isPinned });
  await renderVariables();

  const message = isPinned
    ? t('variablePinned', variable.name)
    : t('variableUnpinned', variable.name);
  const toast = document.createElement('smb-toast');

  toast.message = message;
  toast.addAction(t('undo'), async () => {
    try {
      await saveVariableData({ ...variable, pinned: !isPinned });
      await renderVariables();
    } catch (error) {
      console.error(error);
    }
  });

  toast.show('main-toast');
}
