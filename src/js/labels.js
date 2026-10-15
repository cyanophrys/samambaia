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
  deleteLabelData,
  getAllLabels,
  getAllScripts,
  getLabel,
  saveLabelData,
  saveScriptData,
} from './db.js';

import {
  applyTranslations,
  t,
} from './i18n.js';

const MAX_LABEL_NAME_LENGTH = 128;

let cachedLabels = [];
let draftScriptLabels = [];
let selectedScriptLabels = [];
let labelItemTemplate;
let scriptLabelRowTemplate;

function getLabelItemTemplate() {
  if (!labelItemTemplate) {
    labelItemTemplate = document.getElementById('label-item-template');
    applyTranslations(labelItemTemplate.content);
  }

  return labelItemTemplate;
}

function getScriptLabelRowTemplate() {
  return scriptLabelRowTemplate ??= document.getElementById('script-label-row-template');
}

export function getSelectedScriptLabels() {
  return [...selectedScriptLabels];
}

export function setSelectedScriptLabels(labels) {
  selectedScriptLabels = (labels ?? []).map(String);
  updateScriptLabelsSubtitle();
}

export function updateSelectedLabelItem(selectedLabel) {
  const labelItems = document.querySelectorAll('.label-item');

  labelItems.forEach(item => {
    item.setAttribute(
      'aria-current',
      String(item.dataset.target === String(selectedLabel))
    );
  });
}

function updateScriptLabelsVisibility() {
  const button = document.querySelector(
    '[data-action="selectScriptLabels"]'
  );

  if (button) {
    button.hidden = cachedLabels.length === 0;
  }
}

function updateScriptLabelsSubtitle() {
  const subtitle = document.getElementById('script-labels-subtitle');
  if (!subtitle) return;

  const count = selectedScriptLabels.length;

  subtitle.textContent = count === 0
    ? t('noLabelsSelected')
    : count === 1
      ? t('oneLabelSelected')
      : t('labelsSelectedCount', [String(count)]);
}

export async function renderLabels() {
  cachedLabels = (await getAllLabels()).sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
  );

  const container = document.getElementById('labels-container');

  container.replaceChildren(
    ...cachedLabels.map(createLabelElement)
  );

  updateScriptLabelsVisibility();
}

export function createLabelElement(label) {
  const template = getLabelItemTemplate();
  const item = template.content.firstElementChild.cloneNode(true);

  item.dataset.target = label.id;
  item.setAttribute('aria-label', label.name);

  const title = item.querySelector('.title');
  const moreButton = item.querySelector('[aria-haspopup]');
  const menu = item.querySelector('.menu');
  const editButton = item.querySelector('[data-action="editLabel"]');
  const deleteButton = item.querySelector('[data-action="deleteLabel"]');

  const actionsId = `label-menu-${label.id}`;
  const anchorName = `--label-menu-${label.id}`;

  title.textContent = label.name;

  moreButton.setAttribute('popovertarget', actionsId);
  moreButton.style.anchorName = anchorName;

  menu.id = actionsId;
  menu.style.positionAnchor = anchorName;
  menu.setAttribute('aria-label', t('optionsFor', [label.name]));

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

  dialog.heading = t('addLabel');
  dialog.subtitle = '';
  if (saveButton) saveButton.textContent = t('add');

  dialog.showModal();
}

export async function editLabel(element) {
  const id = Number(element.dataset.target);
  if (Number.isNaN(id)) return;

  const label = await getLabel(id);
  if (!label) return;

  const dialog = document.getElementById('label-dialog');
  const form = dialog.querySelector('form');
  const saveButton = dialog.querySelector('button[type="submit"]');

  form.elements['id'].value = label.id;
  form.elements['name'].value = label.name;

  dialog.heading = t('editLabel');
  dialog.subtitle = label.name;
  if (saveButton) saveButton.textContent = t('edit');

  dialog.showModal();
}

export async function deleteLabel(element) {
  const id = Number(element.dataset.target);

  if (Number.isNaN(id)) return;

  const label = await getLabel(id);
  if (!label) return;

  const dialog = document.createElement('smb-alert-dialog');

  dialog.heading = t('deleteLabelHeading');
  dialog.body = t('deleteLabelBody', [label.name]);

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

      toast.message = t('labelDeleted', [label.name]);
      toast.show('main-toast');

      document.dispatchEvent(new CustomEvent('label:changed'));
    } catch (error) {
      console.error(error);
    }
  }, { once: true });

  dialog.showModal();
}

export async function saveLabel() {
  const normalizeName = value => value.trim().replace(/\s+/g, ' ').toLowerCase();
  const dialog = document.getElementById('label-dialog');
  const form = document.getElementById('label-form');
  const id = form.elements['id'].value ? Number(form.elements['id'].value) : undefined;
  const name = form.elements['name'].value.trim().replace(/\s+/g, ' ');

  if (!name) return;

  if (name.length > MAX_LABEL_NAME_LENGTH) {
    const toast = document.createElement('smb-toast');

    toast.message = t('labelNameTooLong', [String(MAX_LABEL_NAME_LENGTH)]);
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
    ? { ...existingLabel, name }
    : { id, name };

  await saveLabelData(labelData);
  dialog.close();
  await renderLabels();

  const message = t(id ? 'labelEdited' : 'labelAdded', [name]);

  const toast = document.createElement('smb-toast');
  toast.message = message;
  toast.show('main-toast');

  document.dispatchEvent(new CustomEvent('label:changed'));
}

export async function selectScriptLabels() {
  const dialog = document.getElementById('labels-selection-dialog');
  const input = dialog.querySelector('[data-action="filterScriptLabels"]');

  draftScriptLabels = [...selectedScriptLabels];
  input.value = '';

  await renderScriptLabelsList();

  dialog.showModal();
}

export function saveLabelsSelection() {
  const dialog = document.getElementById('labels-selection-dialog');

  setSelectedScriptLabels(draftScriptLabels);
  draftScriptLabels = [];

  dialog.close();
}

function createScriptLabelRow(label) {
  const template = getScriptLabelRowTemplate();
  const row = template.content.firstElementChild.cloneNode(true);

  const input = row.querySelector('input');
  const span = row.querySelector('span');

  input.name = `script-label-${label.id}`;
  input.dataset.target = label.id;
  input.checked = draftScriptLabels.includes(String(label.id));

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

  updateScriptLabelsVisibility();

  const selected = cachedLabels.filter(label => draftScriptLabels.includes(String(label.id)));
  const available = cachedLabels.filter(label => !draftScriptLabels.includes(String(label.id)));

  selectedSection.hidden = selected.length === 0;

  selectedContainer.replaceChildren(...selected.map(createScriptLabelRow));
  availableContainer.replaceChildren(...available.map(createScriptLabelRow));

  filterScriptLabels();
}

export function filterScriptLabels() {
  const dialog = document.getElementById('labels-selection-dialog');
  const input = dialog.querySelector('[data-action="filterScriptLabels"]');
  const stack = dialog.querySelector('smb-stack');
  const results = document.getElementById('labels-search-results');
  const query = input.value.toLowerCase().trim();

  if (!query) {
    stack.show('labels-list');
    return;
  }

  const matchingLabels = cachedLabels
    .filter(label => label.name.toLowerCase().includes(query))
    .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));

  if (matchingLabels.length === 0) {
    stack.show('no-search-results');
    return;
  }

  if (results)
    results.replaceChildren(...matchingLabels.map(createScriptLabelRow));

  stack.show('search-results');
}

export function toggleScriptLabel(value, event, element) {
  const id = String(element.dataset.target);
  const dialog = document.getElementById('labels-selection-dialog');
  const inputs = dialog.querySelectorAll(
    `[data-action="toggleScriptLabel"][data-target="${id}"]`
  );

  if (element.checked) {
    if (!draftScriptLabels.includes(id)) draftScriptLabels.push(id);
  } else {
    draftScriptLabels = draftScriptLabels.filter(labelId => labelId !== id);
  }

  inputs.forEach(input => {
    input.checked = element.checked;
  });
}
