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
  deleteLabelData,
  getAllLabels,
  getAllScripts,
  getLabel,
  saveLabelData,
  saveScriptData,
} from './db.js';

import {
  closeDialog,
  openDialog,
} from './utils.js';

import {
  PALETTE_COLORS,
} from './config.js';

import {
  applyTranslations,
  t,
} from './i18n.js';

const MAX_LABEL_NAME_LENGTH = 128;

let cachedLabels = [];
let selectedScriptLabels = [];

function getLabelColor(color) {
  return PALETTE_COLORS.includes(color)
    ? color
    : 'none';
}

export async function renderLabels() {
  const labels = await getAllLabels();
  const pinnedContainer = document.getElementById('pinned-labels');
  const container = document.getElementById('custom-labels');

  labels.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));

  const pinned = labels.filter(l => l.pinned);
  const unpinned = labels.filter(l => !l.pinned);

  pinnedContainer.hidden = pinned.length === 0;
  pinnedContainer.replaceChildren(...pinned.map(createLabelElement));
  container.replaceChildren(...unpinned.map(createLabelElement));
}

export function createLabelElement(label) {
  const template = document.querySelector('#label-item-template');
  const item = template.content.firstElementChild.cloneNode(true);

  applyTranslations(item);

  item.dataset.target = label.id;
  item.setAttribute('aria-label', label.name);
  item.dataset.pinned = label.pinned ? 'true' : 'false';
  item.dataset.color = getLabelColor(label.color);

  const title = item.querySelector('.title');
  const moreButton = item.querySelector('[aria-haspopup]');
  const menu = item.querySelector('.menu');
  const editButton = item.querySelector('[data-action="editLabel"]');
  const deleteButton = item.querySelector('[data-action="deleteLabel"]');
  const pinButton = item.querySelector('[data-action="togglePinLabel"]');
  const pinLabel = pinButton.querySelector('span');

  const actionsId = `label-menu-${label.id}`;
  const anchorName = `--label-menu-${label.id}`;

  title.textContent = label.name;

  moreButton.setAttribute('popovertarget', actionsId);
  moreButton.style.anchorName = anchorName;

  menu.id = actionsId;
  menu.style.positionAnchor = anchorName;
  menu.setAttribute('aria-label', t('labelMenuOptions', label.name));

  pinButton.setAttribute('popovertarget', actionsId);
  pinButton.setAttribute('popovertargetaction', 'hide');
  pinButton.dataset.target = label.id;
  pinLabel.textContent = label.pinned ? t('unpin') : t('pin');

  editButton.setAttribute('popovertarget', actionsId);
  editButton.dataset.target = label.id;

  deleteButton.setAttribute('popovertarget', actionsId);
  deleteButton.dataset.target = label.id;

  return item;
}

export function addLabel() {
  const dialog = document.getElementById('label-dialog');
  const form = dialog.querySelector('form');
  const saveButton = dialog.querySelector('button[type="submit"]');

  form.reset();

  dialog.title = t('addLabel');
  dialog.subtitle = '';
  if (saveButton) saveButton.textContent = t('add');

  openDialog('label-dialog');
}

export async function editLabel(element) {
  const id = Number(element.dataset.target);
  if (Number.isNaN(id)) return;

  const label = await getLabel(id);
  if (!label) return;

  const dialog = document.getElementById('label-dialog');
  const form = dialog.querySelector('form');
  const saveButton = dialog.querySelector('button[type="submit"]');
  const savedColor = getLabelColor(label.color);
  const colorInput = form.elements['label-color'];

  form.elements['id'].value = label.id;
  form.elements['name'].value = label.name;

  for (const input of colorInput)
    input.checked = input.value === savedColor;

  dialog.title = t('editLabel');
  dialog.subtitle = label.name;
  if (saveButton) saveButton.textContent = t('edit');

  openDialog('label-dialog');
}

export async function deleteLabel(element) {
  const id = Number(element.dataset.target);

  if (Number.isNaN(id)) return;

  const label = await getLabel(id);
  if (!label) return;

  const dialog = document.createElement('smb-alert-dialog');

  dialog.title = t('deleteLabelTitle');
  dialog.message = t('deleteLabelMessage', label.name);

  dialog.addResponses([
    { id: 'cancel', label: t('cancel'), appearance: 'default' },
    { id: 'delete', label: t('deleteLabel'), appearance: 'destructive' }
  ]);

  dialog.addEventListener('response', async (e) => {
    if (e.detail.response !== 'delete') return;

    try {
      const scripts = await getAllScripts();

      await Promise.all(
        scripts
          .filter(script => (script.labels ?? []).map(String).includes(String(id)))
          .map(script =>
            saveScriptData({
              ...script,
              labels: (script.labels ?? []).map(String).filter(labelId => labelId !== String(id))
            })
          )
      );

      await deleteLabelData(id);
      await renderLabels();

      const toast = document.createElement('smb-toast');

      toast.message = t('labelDeleted', label.name);
      toast.show('main-toast');

      document.dispatchEvent(new CustomEvent('label:changed'));
    } catch (error) {
      console.error(error);
    }
  }, { once: true });

  dialog.showModal();
}

export async function saveLabel() {
  const normalizeName = value =>
    value.trim().replace(/\s+/g, ' ').toLowerCase();

  const form = document.getElementById('label-form');
  const id = form.elements['id'].value ? Number(form.elements['id'].value) : undefined;
  const name = form.elements['name'].value.trim().replace(/\s+/g, ' ');
  const color = getLabelColor(form.elements['label-color']?.value);

  if (!name) return;

  if (name.length > MAX_LABEL_NAME_LENGTH) {
    const toast = document.createElement('smb-toast');

    toast.message = t(
      'labelNameTooLong',
      String(MAX_LABEL_NAME_LENGTH)
    );
    toast.show('label-dialog-toast');
    return;
  }

  const labels = await getAllLabels();
  const normalizedName = normalizeName(name);

  const isDuplicate = labels.some(label =>
    label.id !== id &&
    normalizeName(label.name) === normalizedName
  );

  if (isDuplicate) {
    const toast = document.createElement('smb-toast');
    toast.message = t('labelNameDuplicate');
    toast.show('label-dialog-toast');
    return;
  }

  const existingLabel = labels.find(label => label.id === id);
  const labelData = existingLabel
    ? { ...existingLabel, name, color }
    : { id, name, color };

  await saveLabelData(labelData);
  closeDialog('label-dialog');
  await renderLabels();

  const message = id
    ? t('labelEdited', name)
    : t('labelAdded', name);

  const toast = document.createElement('smb-toast');
  toast.message = message;
  toast.show('main-toast');

  document.dispatchEvent(new CustomEvent('label:changed'));
}

export function getSelectedScriptLabels() {
  return [...selectedScriptLabels];
}

export function setSelectedScriptLabels(labels) {
  selectedScriptLabels = (labels ?? []).map(String);
  updateScriptLabelsSubtitle();
}

function updateScriptLabelsSubtitle() {
  const subtitle = document.getElementById('script-labels-subtitle');
  if (!subtitle) return;

  const count = selectedScriptLabels.length;

  subtitle.textContent = count === 0
    ? t('noLabelsSelected')
    : count === 1
      ? t('oneLabelSelected')
      : t('labelsSelectedCount', String(count));
}

export async function openLabelsSelectionDialog() {
  const dialog = document.getElementById('labels-selection-dialog');
  const input = dialog.querySelector('input[type="search"]');

  input.value = '';

  await renderScriptLabelsList();

  openDialog(dialog);
}

function createScriptLabelRow(label) {
  const template = document.querySelector('#script-label-row-template');
  const row = template.content.firstElementChild.cloneNode(true);

  const input = row.querySelector('input');
  const span = row.querySelector('span');

  input.name = `script-label-${label.id}`;
  input.dataset.target = label.id;
  input.checked = selectedScriptLabels.includes(String(label.id));

  span.textContent = label.name;

  return row;
}

export async function renderScriptLabelsList() {
  const selectedSection = document.getElementById('selected-labels-section');
  const selectedContainer = document.getElementById('selected-labels-list');
  const availableContainer = document.getElementById('available-labels-list');

  if (!selectedSection || !selectedContainer || !availableContainer) return;

  cachedLabels = (await getAllLabels()).sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
  );

  const selected = cachedLabels.filter(label => selectedScriptLabels.includes(String(label.id)));
  const available = cachedLabels.filter(label => !selectedScriptLabels.includes(String(label.id)));

  selectedSection.hidden = selected.length === 0;

  selectedContainer.replaceChildren(...selected.map(createScriptLabelRow));
  availableContainer.replaceChildren(...available.map(createScriptLabelRow));

  filterScriptLabels();
}

export function filterScriptLabels() {
  const input = document.getElementById('labels-search-input');
  const stack = document.getElementById('labels-stack');
  const searchResults = document.getElementById('labels-search-results');
  const query = input?.value.toLowerCase().trim() ?? '';

  if (!stack) return;

  if (!query) {
    stack.show(cachedLabels.length === 0 ? 'no-labels' : 'labels-list');
    return;
  }

  const matchingLabels = cachedLabels
    .filter(label => label.name.toLowerCase().includes(query))
    .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));

  if (matchingLabels.length === 0) {
    stack.show('no-search-results');
    return;
  }

  if (searchResults) {
    const list = document.createElement('div');
    list.className = 'list-group rows-separated';
    list.replaceChildren(...matchingLabels.map(createScriptLabelRow));
    searchResults.replaceChildren(list);
  }

  stack.show('search-results');
}

export function toggleScriptLabel(value, event, element) {
  const id = String(element.dataset.target);

  if (element.checked) {
    if (!selectedScriptLabels.includes(id)) selectedScriptLabels.push(id);
  } else {
    selectedScriptLabels = selectedScriptLabels.filter(labelId => labelId !== id);
  }

  updateScriptLabelsSubtitle();
}

export async function togglePinLabel(target) {
  const id = Number(target.dataset.target);
  if (Number.isNaN(id)) return;

  const label = await getLabel(id);
  if (!label) return;

  const isPinned = !label.pinned;

  await saveLabelData({ ...label, pinned: isPinned });
  await renderLabels();

  const message = isPinned
    ? t('labelPinned', label.name)
    : t('labelUnpinned', label.name);
  const toast = document.createElement('smb-toast');

  toast.message = message;
  toast.addAction(t('undo'), async () => {
    try {
      await saveLabelData({ ...label, pinned: !isPinned });
      await renderLabels();
    } catch (error) {
      console.error(error);
    }
  });

  toast.show('main-toast');
}
