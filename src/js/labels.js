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

let labelItemTemplate;

function getLabelItemTemplate() {
  if (!labelItemTemplate) {
    labelItemTemplate = document.getElementById('label-item-template');
    applyTranslations(labelItemTemplate.content);
  }

  return labelItemTemplate;
}

export async function renderLabels() {
  const labels = await getAllLabels();
  const container = document.getElementById('labels-container');

  labels.sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
  );

  container.replaceChildren(
    ...labels.map(createLabelElement)
  );
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
