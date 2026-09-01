import {
  deleteScriptData,
  getAllScripts,
  getScript,
  saveScriptData,
  saveScriptsOrderData,
} from './db.js';

import {
  closeDialog,
  openDialog,
} from './utils.js';

import {
  LIMITS,
  PALETTE_COLORS,
  PSEUDO_LABELS,
} from './config.js';

import {
  getSelectedScriptLabels,
  setSelectedScriptLabels,
} from './labels.js';

import {
  applyVariables
} from './variables.js';

import {
  userPreferences,
} from './preferences.js';

import {
  state,
} from './state.js';

import {
  makeSortable,
} from './dnd.js';

import {
  applyTranslations,
  t,
} from './i18n.js';

let selectedLabel = 'all';

export function getScriptColor(color) {
  return PALETTE_COLORS.includes(color)
    ? color
    : 'none';
}

function getVisibleScripts() {
  return [...document.querySelectorAll('.script-item:not([hidden])')];
}

function updateSelectedLabelItem() {
  const labelItems = document.querySelectorAll('.label-item');

  labelItems.forEach(item => {
    item.toggleAttribute(
      'aria-current',
      item.dataset.target === String(selectedLabel)
    );
  });
}

function updateClearRecentScriptsButton() {
  const button = document.querySelector('[data-action="clearRecentScripts"]');
  if (!button) return;

  button.disabled = !state.recentScripts.length;
}

function updateScriptsCount(scriptCount) {
  const scriptsCount = document.getElementById('scripts-count');

  if (scriptsCount)
    scriptsCount.textContent = scriptCount;
}

export function updateScriptMoveButtons() {
  const items = getVisibleScripts();
  const isRecent = selectedLabel === 'recent';

  items.forEach((item, index) => {
    const previousButton = item.querySelector('[data-action="moveScriptPrevious"]');
    const nextButton = item.querySelector('[data-action="moveScriptNext"]');

    if (previousButton)
      previousButton.disabled = isRecent || index === 0;

    if (nextButton)
      nextButton.disabled = isRecent || index === items.length - 1;
  });
}

function updateDragHandles() {
  const isRecent = selectedLabel === 'recent';
  const dragHandles = '[data-drag-handle]';

  getVisibleScripts().forEach(item => {
    item.querySelector(dragHandles)?.toggleAttribute('hidden', isRecent);
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

  applyTranslations(item);

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
  const color = getScriptColor(script.color);
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
  content.dataset.color = color;

  menu.id = popoverId;
  menu.style.positionAnchor = anchorName;
  menu.setAttribute('aria-label', t('scriptMenuOptions', [script.name]));

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
    ? t('removeFavorite')
    : t('addFavorite');

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

  scripts.sort((a, b) =>
    (a.order ?? Infinity) - (b.order ?? Infinity) || a.id - b.id
  );

  const container = document.getElementById('custom-scripts');

  container.replaceChildren(
    ...scripts.map((script, index) => {
      const item = createScriptElement(script);
      item.dataset.index = index;
      return item;
    })
  );

  updateClearRecentScriptsButton();
  updateScriptsCount(scripts.length);

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

  dialog.title = t('addScript');
  dialog.subtitle = '';
  if (saveButton) saveButton.textContent = t('add');

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
  const colorInput = form.elements['script-color'];

  setSelectedScriptLabels(script.labels);

  form.elements['id'].value = script.id;
  form.elements['name'].value = script.name;
  form.elements['content'].value = script.content;
  form.elements['notes'].value = script.notes ?? '';

  for (const input of colorInput)
    input.checked = input.value === getScriptColor(script.color);

  dialog.title = t('editScript');
  dialog.subtitle = script.name;
  if (saveButton) saveButton.textContent = t('edit');

  openDialog('script-dialog');
}

export async function saveScript() {
  const form = document.getElementById('script-form');
  const id = form.elements['id'].value || undefined;
  const name = form.elements['name'].value.trim();
  const content = form.elements['content'].value;
  const notes = form.elements['notes'].value;
  const color = getScriptColor(form.elements['script-color']?.value);

  if (
    !name ||
    !content ||
    name.length > LIMITS.MAX_SCRIPT_NAME_LENGTH ||
    content.length > LIMITS.MAX_SCRIPT_CONTENT_LENGTH ||
    notes.length > LIMITS.MAX_SCRIPT_NOTES_LENGTH
  ) {
    return;
  }

  const script = id ? await getScript(Number(id)) : null;
  const order = script?.order;

  const scriptData = {
    id,
    name,
    labels: getSelectedScriptLabels(),
    content,
    notes,
    color,
    order,
  };

  await saveScriptData(scriptData);
  closeDialog('script-dialog');
  await renderScripts();

  const message = id
    ? t('scriptEdited', [name])
    : t('scriptAdded', [name]);
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

  dialog.title = t('deleteScriptTitle');
  dialog.message = t('deleteScriptMessage', [script.name]);

  dialog.addResponses([
    { id: 'cancel', label: t('cancel'), appearance: 'default' },
    { id: 'delete', label: t('deleteScript'), appearance: 'destructive' }
  ]);

  dialog.addEventListener('response', async (e) => {
    if (e.detail.response === 'delete') {
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

function addRecentScript(id) {
  if (!userPreferences.recentScripts) return;

  const ids = state.recentScripts.filter(recentId => recentId !== id);

  ids.unshift(id);
  state.recentScripts = ids.slice(0, LIMITS.MAX_RECENT_SCRIPTS);

  updateClearRecentScriptsButton();
}

export function clearRecentScripts() {
  if (!state.recentScripts.length)
    return;

  const dialog = document.createElement('smb-alert-dialog');

  dialog.title = t('clearRecentHistoryTitle');
  dialog.message = t('clearRecentHistoryMessage');

  dialog.addResponses([
    { id: 'cancel', label: t('cancel'), appearance: 'default' },
    { id: 'clear', label: t('clearHistory'), appearance: 'destructive' }
  ]);

  dialog.addEventListener('response', e => {
    if (e.detail.response !== 'clear')
      return;

    state.recentScripts = [];

    updateClearRecentScriptsButton();
    filterScripts();

    const toast = document.createElement('smb-toast');

    toast.message = t('recentHistoryCleared');
    toast.show('settings-dialog-toast');
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
    addRecentScript(id);

    const message = t('copiedToClipboard');
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
    : selectedLabel === 'recent'
      ? state.recentScripts.includes(Number(script.dataset.target))
      : PSEUDO_LABELS.includes(selectedLabel)
        ? true
        : script.dataset.labels.split(' ').includes(String(selectedLabel));
}

export function highlightQuery(roots, query) {
  const name = 'query';
  let highlight = CSS.highlights.get(name);

  if (!highlight) {
    highlight = new Highlight();
    CSS.highlights.set(name, highlight);
  }

  highlight.clear();
  if (!query) return;

  for (const root of roots) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let node;

    while ((node = walker.nextNode())) {
      const text = node.textContent.toLowerCase();
      let index = text.indexOf(query);

      while (index !== -1) {
        const range = new Range();
        range.setStart(node, index);
        range.setEnd(node, index + query.length);
        highlight.add(range);
        index = text.indexOf(query, index + query.length);
      }
    }
  }
}

export function filterScripts() {
  const searchInput = document.getElementById('scripts-search-input');
  const stack = document.getElementById('scripts-view-stack');
  const scriptItems = document.querySelectorAll('.script-item');
  const query = searchInput?.value.toLowerCase().trim() ?? '';

  updateSelectedLabelItem();

  const recentOrder = selectedLabel === 'recent'
    ? new Map(state.recentScripts.map((id, index) => [id, index]))
    : null;

  let labelScriptsCount = 0;
  let visibleScriptsCount = 0;

  scriptItems.forEach(script => {
    script.style.order = recentOrder
      ? recentOrder.get(Number(script.dataset.target)) ?? recentOrder.size
      : '';

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

  updateDragHandles();

  const highlightTargets = document.querySelectorAll(
    '.script-item:not([hidden]) :is(h4, .content, .notes)'
  );
  highlightQuery(highlightTargets, query.length >= 2 ? query : '');

  if (stack) {
    let page = 'scripts';

    if (scriptItems.length === 0)
      page = 'no-scripts';
    else if (selectedLabel === 'recent' && !userPreferences.recentScripts && !query)
      page = 'recent-disabled';
    else if (selectedLabel === 'favorites' && labelScriptsCount === 0 && !query)
      page = 'no-favorites';
    else if (selectedLabel === 'recent' && labelScriptsCount === 0 && !query)
      page = 'no-recent';
    else if (labelScriptsCount === 0 && !searchAll)
      page = 'empty-label';
    else if (visibleScriptsCount === 0)
      page = selectedLabel === 'all'
        ? 'no-search-results'
        : 'no-label-search-results';

    stack.show(page);
  }

  updateScriptMoveButtons();
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

export function initScriptsSortable() {
  const container = document.getElementById('custom-scripts');
  if (!container) return;

  const canDrag = () => selectedLabel !== 'recent';

  makeSortable(container, {
    itemSelector: '.script-item:not([hidden])',
    handleSelector: '[data-drag-handle]',
    scrollContainer: container,
    canDrag,
  });
}

export async function moveScriptPrevious(target) {
  if (selectedLabel === 'recent') return;

  const item = target?.closest('.script-item');
  if (!item) return;

  const items = getVisibleScripts();
  const index = items.indexOf(item);

  if (index <= 0) return;

  const menu = item.querySelector('.menu');
  const focused = document.activeElement;
  const wasOpen = menu?.matches(':popover-open');

  items[index - 1].before(item);
  updateScriptMoveButtons();

  if (wasOpen) {
    menu.showPopover();

    if (menu.contains(focused))
      focused.focus();
  }

  await saveScriptsOrder(item.parentElement);
}

export async function moveScriptNext(target) {
  if (selectedLabel === 'recent') return;

  const item = target?.closest('.script-item');
  if (!item) return;

  const items = getVisibleScripts();
  const index = items.indexOf(item);

  if (index === -1 || index === items.length - 1) return;

  const menu = item.querySelector('.menu');
  const focused = document.activeElement;
  const wasOpen = menu?.matches(':popover-open');

  items[index + 1].after(item);
  updateScriptMoveButtons();

  if (wasOpen) {
    menu.showPopover();

    if (menu.contains(focused))
      focused.focus();
  }

  await saveScriptsOrder(item.parentElement);
}

export async function saveScriptsOrder() {
  try {
    const visibleElements = getVisibleScripts();
    const visibleIdsInNewOrder = visibleElements.map(item => Number(item.dataset.target));
    const visibleIdSet = new Set(visibleIdsInNewOrder);

    const allScripts = await getAllScripts();

    allScripts.sort((a, b) =>
      (a.order ?? Infinity) - (b.order ?? Infinity) || a.id - b.id
    );

    const newOrderedIds = [];
    let visibleIndex = 0;

    for (const script of allScripts) {
      if (visibleIdSet.has(script.id)) {
        newOrderedIds.push(visibleIdsInNewOrder[visibleIndex]);
        visibleIndex++;
      } else {
        newOrderedIds.push(script.id);
      }
    }

    await saveScriptsOrderData(newOrderedIds);
  } catch (error) {
    console.error(error);
  }
}
