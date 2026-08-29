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
  deleteVariableData,
  getAllVariables,
  getVariable,
  saveVariableData,
} from './db.js';

import {
  closeDialog,
  openDialog,
} from './utils.js';

import {
  LIMITS,
  VARIABLE_TOKEN_PATTERN,
} from './config.js';

let cachedVariables = [];
let debounceTimeout = null;

export async function renderVariables() {
  const pinnedContainer = document.getElementById('pinned-variables');
  const container = document.getElementById('custom-variables');

  if (!pinnedContainer || !container) return;

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
  const template = document.querySelector('#variable-item-template');
  const item = template.content.firstElementChild.cloneNode(true);

  item.dataset.target = variable.id;
  item.dataset.pinned = variable.pinned ? 'true' : 'false';

  const input = item.querySelector('input');
  const label = item.querySelector('label');
  const moreButton = item.querySelector('[aria-haspopup]');
  const menu = item.querySelector('.menu');
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
  menu.setAttribute('aria-label', `Options for ${variable.name}`);

  pinButton.setAttribute('popovertarget', menuId);
  pinButton.dataset.target = variable.id;
  pinLabel.textContent = variable.pinned ? 'Unpin' : 'Pin';

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

  dialog.title = 'Add variable';
  dialog.subtitle = '';
  if (saveButton) saveButton.textContent = 'Add';

  openDialog('variable-dialog');
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

  dialog.title = 'Edit variable';
  dialog.subtitle = variable.name;
  if (saveButton) saveButton.textContent = 'Edit';

  openDialog('variable-dialog');
}

export async function saveVariable() {
  const form = document.getElementById('variable-form');
  const id = form.elements['id'].value ? Number(form.elements['id'].value) : undefined;
  const rawName = form.elements['name'].value.trim();
  const name = rawName.replace(/[^a-zA-Z0-9_-]/g, '');

  if (!rawName) return;

  if (rawName !== name) {
    const toast = document.createElement('smb-toast');

    toast.message = 'The name can only contain letters, numbers, "_" and "-"';
    toast.show('variable-dialog-toast');
    return;
  }

  if (name.length > LIMITS.MAX_VARIABLE_NAME_LENGTH) {
    const toast = document.createElement('smb-toast');

    toast.message = `Variable name cannot exceed ${LIMITS.MAX_VARIABLE_NAME_LENGTH} characters`;
    toast.show('variable-dialog-toast');
    return;
  }

  const variables = await getAllVariables();
  const isDuplicate = variables.some(variable =>
    variable.name.toLowerCase() === name.toLowerCase() && variable.id !== id
  );

  if (isDuplicate) {
    const toast = document.createElement('smb-toast');

    toast.message = 'A variable with this name already exists';
    toast.show('variable-dialog-toast');
    return;
  }

  const existingVariable = variables.find(variable => variable.id === id);
  const variableData = existingVariable
    ? { ...existingVariable, name }
    : { id, name, value: '' };

  await saveVariableData(variableData);
  closeDialog('variable-dialog');
  await renderVariables();

  const message = id
    ? `Variable "${name}" edited`
    : `Variable "${name}" added`;
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

  dialog.title = 'Delete variable?';
  dialog.message = `Are you sure you want to delete the variable "${variable.name}"? Scripts using "{{${variable.name}}}" will no longer replace it.`;

  dialog.addResponses([
    { id: 'cancel', label: 'Cancel', appearance: 'default' },
    { id: 'delete', label: 'Delete variable', appearance: 'destructive' }
  ]);

  dialog.addEventListener('response', async (e) => {
    if (e.detail.response !== 'delete') return;

    await deleteVariableData(id);
    await renderVariables();

    const toast = document.createElement('smb-toast');

    toast.message = `Variable "${variable.name}" deleted`;
    toast.show('main-toast');
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
    } catch (error) {
      console.error(error);
    }
  }, 500);
}

export function applyVariables(content) {
  const inputs = document.querySelectorAll('#custom-variables [data-variable-value]');
  const values = new Map();

  inputs.forEach(input => {
    const name = input.dataset.name;
    if (name && input.value) values.set(name, input.value);
  });

  return content.replace(VARIABLE_TOKEN_PATTERN, (match, name) =>
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
    ? `Variable "${variable.name}" pinned`
    : `Variable "${variable.name}" unpinned`;
  const toast = document.createElement('smb-toast');

  toast.message = message;
  toast.addAction('Undo', async () => {
    try {
      await saveVariableData({ ...variable, pinned: !isPinned });
      await renderVariables();
    } catch (error) {
      console.error(error);
    }
  });

  toast.show('main-toast');
}
