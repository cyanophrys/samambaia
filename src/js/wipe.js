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
  wipeStoredData,
} from './store.js';

import {
  wipeDB,
} from './db.js';

import {
  t,
} from './i18n.js';

export async function wipeData() {
  const dialog = document.createElement('smb-alert-dialog');

  dialog.heading = t('deleteAllDataHeading');
  dialog.body = t('deleteAllDataBody');

  const confirmation = document
    .getElementById('wipe-confirmation-template')
    .content.firstElementChild.cloneNode(true);
  const confirmationLabel = confirmation.querySelector('span');

  confirmationLabel.textContent = t('wipeConfirmationLabel');
  dialog.append(confirmation);

  dialog.addResponses([
    { id: 'cancel', label: t('cancel'), appearance: 'default' },
    { id: 'wipe', label: t('deleteData'), appearance: 'destructive' }
  ]);

  dialog.setResponseEnabled('wipe', false);

  const checkbox = confirmation.querySelector('input');

  checkbox.addEventListener('change', () => {
    dialog.setResponseEnabled('wipe', checkbox.checked);
  });

  dialog.addEventListener('response', async (e) => {
    if (e.detail.response !== 'wipe') return;

    try {
      const { mainTabId } = await chrome.storage.local.get('mainTabId');

      await wipeStoredData(mainTabId !== undefined ? { mainTabId } : {});
      await wipeDB();

      sessionStorage.setItem('pendingToast', t('dataDeleted'));

      window.location.reload();
    } catch (error) {
      console.error(error);

      const toast = document.createElement('smb-toast');

      toast.type = 'error';
      toast.message = t('errorDeletingData');
      toast.show('main-toast');
    }
  }, { once: true });

  dialog.showModal();
}
