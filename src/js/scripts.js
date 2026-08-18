import {
  deleteScriptData,
  getAllScripts,
  getScript,
  saveScriptData,
} from './db.js';

import {
  closeDialog,
  openDialog,
} from './utils.js';

import {
  LIMITS,
  PSEUDO_LABELS,
} from './config.js';

import {
  getSelectedScriptLabels,
  setSelectedScriptLabels,
} from './labels.js';

import {
  applyVariables
} from './variables.js';

let selectedLabel = 'all';

function updateSelectedLabelItem() {
  const labelItems = document.querySelectorAll('.label-item');

  labelItems.forEach(item => {
    item.toggleAttribute(
      'aria-current',
      item.dataset.target === String(selectedLabel)
    );
  });
}

export function scrollScriptsView() {
  const element = document.getElementById('custom-scripts');

  if (!element) return;

  if (element.scrollTop <= 800) {
    element.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
    return;
  }

  element.scrollTo({
    top: 500,
    behavior: 'instant'
  });

  requestAnimationFrame(() => {
    element.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  });
}

export function createScriptElement(script) {
  const template = document.querySelector('#script-item-template');
  const item = template.content.firstElementChild.cloneNode(true);

  item.dataset.target = script.id;
  item.dataset.labels = (script.labels?.length ? script.labels.map(String) : ['none']).join(' ');
  item.dataset.favorite = script.favorite ? 'true' : 'false';

  const title = item.querySelector('h4');
  const moreButton = item.querySelector('[aria-haspopup]');
  const copyButton = item.querySelector('[data-action="copyScript"]');
  const content = item.querySelector('.content');
  const menu = item.querySelector('.menu');
  const notes = item.querySelector('.notes');
  const favoriteButton = item.querySelector('[data-action="toggleFavoriteScript"]');
  const favoriteLabel = favoriteButton.querySelector('span');
  const editButton = item.querySelector('[data-action="editScript"]');
  const deleteButton = item.querySelector('[data-action="deleteScript"]');

  const popoverId = `script-menu-${script.id}`;
  const anchorName = `--script-menu-${script.id}`;

  title.id = `script-title-${script.id}`;
  title.textContent = script.name;

  content.id = `script-content-${script.id}`;

  item.setAttribute('aria-labelledby', title.id);
  item.setAttribute('aria-describedby', content.id);

  moreButton.setAttribute('popovertarget', popoverId);
  moreButton.style.anchorName = anchorName;

  copyButton.dataset.target = script.id;
  content.dataset.target = script.id;

  content.textContent = script.content;

  menu.id = popoverId;
  menu.style.positionAnchor = anchorName;
  menu.setAttribute('aria-label', `Options for ${script.name}`);

  if (script.notes) {
    notes.id = `script-notes-${script.id}`;
    notes.hidden = false;
    notes.querySelector('span').textContent = script.notes;

    item.setAttribute(
      'aria-describedby',
      `${content.id} ${notes.id}`
    );
  } else {
    notes.remove();
  }

  favoriteLabel.textContent = script.favorite
    ? 'Remove from favorites'
    : 'Add to favorites';

  favoriteButton.setAttribute('popovertarget', popoverId);
  favoriteButton.dataset.target = script.id;

  editButton.setAttribute('popovertarget', popoverId);
  editButton.dataset.target = script.id;

  deleteButton.setAttribute('popovertarget', popoverId);
  deleteButton.dataset.target = script.id;

  return item;
}

export async function renderScripts() {
  const scripts = await getAllScripts();
  const container = document.getElementById('custom-scripts');

  container.replaceChildren(...scripts.map(createScriptElement));

  filterScripts();
}

export function addScript() {
  const dialog = document.getElementById('script-dialog');
  const form = dialog.querySelector('form');
  const saveButton = dialog.querySelector('button[type="submit"]');

  form.reset();

  setSelectedScriptLabels(
    PSEUDO_LABELS.includes(selectedLabel) || selectedLabel === 'none'
      ? []
      : [String(selectedLabel)]
  );

  dialog.title = 'Add script';
  dialog.subtitle = '';
  if (saveButton) saveButton.textContent = 'Add';

  openDialog('script-dialog');
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
  form.elements['notes'].value = script.notes ?? '';

  dialog.title = 'Edit script';
  dialog.subtitle = script.name;
  if (saveButton) saveButton.textContent = 'Edit';

  openDialog('script-dialog');
}

export async function saveScript() {
  const form = document.getElementById('script-form');
  const id = form.elements['id'].value || undefined;
  const name = form.elements['name'].value.trim();
  const content = form.elements['content'].value;
  const notes = form.elements['notes'].value;

  if (
    !name ||
    !content ||
    name.length > LIMITS.MAX_SCRIPT_NAME_LENGTH ||
    content.length > LIMITS.MAX_SCRIPT_CONTENT_LENGTH ||
    notes.length > LIMITS.MAX_SCRIPT_NOTES_LENGTH
  ) {
    return;
  }

  const scriptData = {
    id,
    name,
    labels: getSelectedScriptLabels(),
    content,
    notes,
  };

  await saveScriptData(scriptData);
  closeDialog('script-dialog');
  await renderScripts();

  const message = id
    ? `Script "${name}" edited`
    : `Script "${name}" added`;
  const toast = document.createElement('smb-toast');

  toast.message = message;
  toast.show('main-toast');
}

export async function deleteScript(element) {
  const id = Number(element.dataset.target);

  if (Number.isNaN(id)) {
    console.error("Invalid script ID for deletion:", element);
    return;
  }

  const script = await getScript(id);
  if (!script) return;

  const dialog = document.createElement('smb-alert-dialog');

  dialog.title = 'Delete script?';
  dialog.message = `Are you sure you want to delete "${script.name}"? This action cannot be undone.`;

  dialog.addResponses([
    { id: 'cancel', label: 'Cancel', appearance: 'default' },
    { id: 'delete', label: 'Delete script', appearance: 'destructive' }
  ]);

  dialog.addEventListener('response', async (e) => {
    if (e.detail.response === 'delete') {
      await deleteScriptData(id);
      await renderScripts();

      const message = `Script "${script.name}" deleted`;
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

  try {
    const script = await getScript(id);
    if (!script) return;

    await navigator.clipboard.writeText(applyVariables(script.content));

    const message = `Copied to clipboard`;
    const toast = document.createElement('smb-toast');

    toast.message = message;
    toast.show('main-toast');
  } catch (error) {
    console.error(error);
  }
}

function scriptMatchesLabel(script) {
  return selectedLabel === 'favorites'
    ? script.dataset.favorite === 'true'
    : PSEUDO_LABELS.includes(selectedLabel)
      ? true
      : script.dataset.labels.split(' ').includes(String(selectedLabel));
}

export function filterScripts() {
  const searchInput = document.getElementById('scripts-search-input');
  const stack = document.getElementById('scripts-view-stack');
  const scriptItems = document.querySelectorAll('.script-item');
  const query = searchInput?.value.toLowerCase().trim() ?? '';

  updateSelectedLabelItem();

  let labelScriptsCount = 0;
  let visibleScriptsCount = 0;

  scriptItems.forEach(script => {
    if (scriptMatchesLabel(script))
      labelScriptsCount++;
  });

  const searchAll = selectedLabel !== 'all'
    && labelScriptsCount === 0
    && query.length > 0;

  scriptItems.forEach(script => {
    const text = script.textContent.toLowerCase();
    const matchesLabel = searchAll || scriptMatchesLabel(script);
    const isVisible = matchesLabel && text.includes(query);

    script.hidden = !isVisible;

    if (isVisible)
      visibleScriptsCount++;
  });

  if (stack) {
    let page = 'scripts';

    if (scriptItems.length === 0)
      page = 'no-scripts';
    else if (selectedLabel === 'favorites' && labelScriptsCount === 0 && !query)
      page = 'no-favorites';
    else if (labelScriptsCount === 0 && !searchAll)
      page = 'empty-label';
    else if (visibleScriptsCount === 0)
      page = selectedLabel === 'all'
        ? 'no-search-results'
        : 'no-label-search-results';

    stack.show(page);
  }
}

export function filterByLabel(target) {
  const label = String(
    typeof target === 'string'
      ? target
      : target.dataset.target
  );
  const searchInput = document.getElementById('scripts-search-input');
  const element = document.getElementById('custom-scripts');

  selectedLabel = label;

  if (searchInput) {
    searchInput.value = '';
    searchInput.focus();
  }

  if (element)
    element.scrollTo({
      top: 0,
      behavior: 'instant'
    });

  filterScripts();
}

export function searchAllScripts() {
  if (selectedLabel === 'all') return;

  const searchInput = document.getElementById('scripts-search-input');

  selectedLabel = 'all';

  filterScripts();

  searchInput?.focus();
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
    ? `Script "${script.name}" added to favorites`
    : `Script "${script.name}" removed from favorites`;
  const toast = document.createElement('smb-toast');

  toast.message = message;
  toast.addAction('Undo', async () => {
    try {
      await saveScriptData({ ...script, favorite: !isFavorite });
      await renderScripts();
    } catch (error) {
      console.error(error);
    }
  });

  toast.show('main-toast');
}
