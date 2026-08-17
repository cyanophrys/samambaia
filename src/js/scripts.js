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
} from './config.js';

export function createScriptElement(script) {
  const template = document.querySelector('#script-item-template');
  const item = template.content.firstElementChild.cloneNode(true);

  item.dataset.target = script.id;

  const title = item.querySelector('h4');
  const moreButton = item.querySelector('[aria-haspopup]');
  const copyButton = item.querySelector('[data-action="copyScript"]');
  const content = item.querySelector('.content');
  const menu = item.querySelector('.menu');
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

  form.elements['id'].value = script.id;
  form.elements['name'].value = script.name;
  form.elements['content'].value = script.content;

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

  if (
    !name ||
    !content ||
    name.length > LIMITS.MAX_SCRIPT_NAME_LENGTH ||
    content.length > LIMITS.MAX_SCRIPT_CONTENT_LENGTH
  ) {
    return;
  }

  const scriptData = { id, name, content };

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

    await navigator.clipboard.writeText(script.content);

    const message = `Copied to clipboard`;
    const toast = document.createElement('smb-toast');

    toast.message = message;
    toast.show('main-toast');
  } catch (error) {
    console.error(error);
  }
}

export function filterScripts() {
  const searchInput = document.getElementById('scripts-search-input');
  const scriptItems = document.querySelectorAll('.script-item');
  const query = searchInput?.value.toLowerCase().trim() ?? '';

  let visibleScriptsCount = 0;

  scriptItems.forEach(script => {
    const isVisible = script.textContent.toLowerCase().includes(query);
    script.hidden = !isVisible;
    if (isVisible) visibleScriptsCount++;
  });
}
