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
  deleteScriptData,
  getAllScripts,
  getScript,
  saveScriptData,
} from './db.js';

import {
  getSelectedScriptLabels,
  setSelectedScriptLabels,
  updateSelectedLabelItem,
} from './labels.js';

import {
  applyTranslations,
  t,
} from './i18n.js';

import {
  scrollToTop,
} from './utils.js';

const MAX_SCRIPT_NAME_LENGTH = 128;
const MAX_SCRIPT_CONTENT_LENGTH = 5000;
const RENDER_CHUNK_SIZE = 250;

let scriptsContainer;
let scriptItemTemplate = null;
let selectedLabel = 'all';

const PSEUDO_LABELS = [
  'all',
  'favorites',
];
const searchTextCache = new WeakMap();

function getScriptItemTemplate() {
  if (!scriptItemTemplate) {
    scriptItemTemplate = document.getElementById('script-item-template');
    applyTranslations(scriptItemTemplate.content);
  }

  return scriptItemTemplate;
}

function getScriptsContainer() {
  return scriptsContainer ??= document.getElementById('scripts-container');
}

function updateScriptsControls(hasScripts) {
  const controls = document.querySelectorAll(
    '[data-action="filterScripts"], [data-action="setViewMode"]'
  );

  controls.forEach(control => {
    control.toggleAttribute('disabled', !hasScripts);
  });
}

export function createScriptElement(script) {
  const template = getScriptItemTemplate();
  const item = template.content.firstElementChild.cloneNode(true);

  item.dataset.target = script.id;
  item.dataset.labels = (script.labels?.length ? script.labels.map(String) : ['none']).join(' ');
  item.dataset.favorite = script.favorite ? 'true' : 'false';

  const title = item.querySelector('.title');
  const content = item.querySelector('.content');
  const menu = item.querySelector('.menu');
  const moreButton = item.querySelector('[aria-haspopup]');
  const favoriteButton = item.querySelector('[data-action="toggleFavoriteScript"]');
  const favoriteLabel = favoriteButton.querySelector('span');
  const editButton = item.querySelector('[data-action="editScript"]');
  const deleteButton = item.querySelector('[data-action="deleteScript"]');
  const copyButton = item.querySelector('[data-action="copyScript"]');

  const popoverId = `script-menu-${script.id}`;
  const anchorName = `--script-menu-${script.id}`;

  title.id = `script-title-${script.id}`;
  title.textContent = script.name;

  copyButton.dataset.target = script.id;

  content.id = `script-content-${script.id}`;
  content.textContent = script.content;
  content.dataset.target = script.id;

  item.setAttribute('aria-labelledby', title.id);
  item.setAttribute('aria-describedby', content.id);

  moreButton.setAttribute('popovertarget', popoverId);
  moreButton.style.anchorName = anchorName;

  menu.id = popoverId;
  menu.style.positionAnchor = anchorName;
  menu.setAttribute('aria-label', t('optionsFor', [script.name]));

  favoriteLabel.textContent = script.favorite
    ? t('removeScriptFavorite')
    : t('addScriptFavorite');

  favoriteButton.setAttribute('popovertarget', popoverId);
  favoriteButton.dataset.target = script.id;

  editButton.setAttribute('popovertarget', popoverId);
  editButton.dataset.target = script.id;

  deleteButton.setAttribute('popovertarget', popoverId);
  deleteButton.dataset.target = script.id;

  searchTextCache.set(item, item.textContent.toLowerCase());

  return item;
}

export async function renderScripts() {
  const scripts = await getAllScripts();

  const container = getScriptsContainer();
  container.replaceChildren();

  updateScriptsControls(scripts.length > 0);

  for (let i = 0; i < scripts.length; i += RENDER_CHUNK_SIZE) {
    const fragment = document.createDocumentFragment();
    const end = Math.min(i + RENDER_CHUNK_SIZE, scripts.length);

    for (let j = i; j < end; j++) {
      const item = createScriptElement(scripts[j]);
      fragment.appendChild(item);
    }

    container.appendChild(fragment);

    if (end < scripts.length)
      await new Promise(requestAnimationFrame);
  }

  filterScripts();
}

export function addScript() {
  const dialog = document.getElementById('script-dialog');
  const form = dialog.querySelector('form');
  const saveButton = dialog.querySelector('button[type="submit"]');

  form.reset();
  form.elements['id'].value = '';

  setSelectedScriptLabels(
    PSEUDO_LABELS.includes(selectedLabel) || selectedLabel === 'none'
      ? []
      : [String(selectedLabel)]
  );

  dialog.heading = t('addScript');
  dialog.subtitle = '';

  if (saveButton)
    saveButton.textContent = t('add');

  dialog.showModal();
}

export async function editScript(element) {
  const id = Number(element.dataset.target);
  if (Number.isNaN(id)) return;

  const script = await getScript(id);
  if (!script) return;

  const dialog = document.getElementById('script-dialog');
  const form = dialog.querySelector('form');
  const saveButton = dialog.querySelector('button[type="submit"]');

  setSelectedScriptLabels(script.labels);

  form.elements['id'].value = script.id;
  form.elements['name'].value = script.name;
  form.elements['content'].value = script.content;

  dialog.heading = t('editScript');
  dialog.subtitle = script.name;

  if (saveButton)
    saveButton.textContent = t('edit');

  dialog.showModal();
}

export async function saveScript() {
  const dialog = document.getElementById('script-dialog');
  const form = dialog.querySelector('form');
  const id = form.elements['id'].value || undefined;
  const name = form.elements['name'].value.trim();
  const content = form.elements['content'].value;

  if (
    !name ||
    !content ||
    name.length > MAX_SCRIPT_NAME_LENGTH ||
    content.length > MAX_SCRIPT_CONTENT_LENGTH
  ) {
    return;
  }

  const scriptData = {
    id,
    name,
    labels: getSelectedScriptLabels(),
    content,
  };

  await saveScriptData(scriptData);

  dialog.close();

  await renderScripts();

  const message = t(id ? 'scriptEdited' : 'scriptAdded', [name]);
  const toast = document.createElement('smb-toast');

  toast.message = message;
  toast.show('main-toast');
}

export async function deleteScript(element) {
  const id = Number(element.dataset.target);

  if (Number.isNaN(id)) {
    console.error('Invalid script ID for deletion:', element);
    return;
  }

  const script = await getScript(id);
  if (!script) return;

  const dialog = document.createElement('smb-alert-dialog');

  dialog.heading = t('deleteScriptHeading');
  dialog.body = t('deleteScriptBody', [script.name]);

  dialog.addResponses([
    {
      id: 'cancel',
      label: t('cancel'),
      appearance: 'default',
    },
    {
      id: 'delete',
      label: t('deleteScript'),
      appearance: 'destructive',
    },
  ]);

  dialog.addEventListener('response', async (event) => {
    if (event.detail.response === 'delete') {
      await deleteScriptData(id);
      await renderScripts();

      const message = t('scriptDeleted', [script.name]);
      const toast = document.createElement('smb-toast');

      toast.message = message;
      toast.show('main-toast');
    }
  }, { once: true });

  dialog.showModal();
}

export async function copyScript(target) {
  const id = Number(target?.dataset?.target);
  if (Number.isNaN(id)) return;

  const toast = document.createElement('smb-toast');

  try {
    const script = await getScript(id);
    if (!script) return;

    await navigator.clipboard.writeText(script.content);

    toast.message = t('copiedToClipboard');
  } catch (error) {
    console.error(error);

    toast.message = t('copyToClipboardError');
  }

  toast.show('main-toast');
}

function scriptMatchesLabel(script) {
  return selectedLabel === 'favorites'
    ? script.dataset.favorite === 'true'
    : PSEUDO_LABELS.includes(selectedLabel)
      ? true
      : script.dataset.labels.split(' ').includes(String(selectedLabel));
}

export function filterScripts() {
  const searchInput = document.querySelector('[data-action="filterScripts"]');
  const stack = document.getElementById('main-stack');
  const items = getScriptsContainer().querySelectorAll('.script-item');
  const query = searchInput?.value.toLowerCase().trim() ?? '';

  updateSelectedLabelItem(selectedLabel);

  let labelScriptsCount = 0;
  let visibleItemsCount = 0;

  items.forEach(item => {
    if (scriptMatchesLabel(item))
      labelScriptsCount++;
  });

  const searchAll = selectedLabel !== 'all'
    && labelScriptsCount === 0
    && query.length > 0;

  items.forEach(item => {
    const searchText = searchTextCache.get(item) ?? item.textContent.toLowerCase();
    const matchesLabel = searchAll || scriptMatchesLabel(item);
    const isVisible = matchesLabel && searchText.includes(query);

    item.hidden = !isVisible;

    if (isVisible)
      visibleItemsCount++;
  });

  let page = 'scripts';

  switch (true) {
    case items.length === 0:
      page = 'no-scripts';
      break;

    case selectedLabel === 'favorites' && labelScriptsCount === 0:
      page = 'no-favorites';
      break;

    case labelScriptsCount === 0 && !searchAll:
      page = 'empty-label';
      break;

    case visibleItemsCount === 0:
      page = selectedLabel === 'all'
        ? 'no-search-results'
        : 'no-label-search-results';
      break;
  }

  stack?.show(page);
}

export function filterByLabel(target) {
  const label = String(
    typeof target === 'string'
      ? target
      : target.dataset.target
  );
  const input = document.querySelector('[data-action="filterScripts"]');
  const element = getScriptsContainer().closest('.scrollable-area');

  selectedLabel = label;

  if (input)
    input.value = '';

  scrollToTop(element);

  filterScripts();
}

export function searchAllScripts() {
  if (selectedLabel === 'all') return;

  const input = document.querySelector('[data-action="filterScripts"]');

  selectedLabel = 'all';

  filterScripts();

  input?.focus();
}

export async function toggleFavoriteScript(target) {
  const id = Number(target.dataset.target);
  if (Number.isNaN(id)) return;

  const script = await getScript(id);
  if (!script) return;

  const isFavorite = !script.favorite;

  await saveScriptData({ ...script, favorite: isFavorite });
  await renderScripts();

  const message = isFavorite
    ? t('scriptAddedToFavorites', [script.name])
    : t('scriptRemovedFromFavorites', [script.name]);
  const toast = document.createElement('smb-toast');

  toast.message = message;
  toast.addAction(t('undo'), async () => {
    try {
      await saveScriptData({ ...script, favorite: !isFavorite });
      await renderScripts();
    } catch (error) {
      console.error(error);
    }
  });

  toast.show('main-toast');
}
