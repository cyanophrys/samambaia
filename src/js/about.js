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
  t,
} from './i18n.js';

const ISSUES_URL = 'https://github.com/cyanophrys/samambaia/issues';
const LICENSE_URL = 'https://www.gnu.org/licenses/gpl-3.0.html';
const PRIVACY_POLICY_URL = 'https://github.com/cyanophrys/samambaia/blob/main/PRIVACY.md';

export function getManifestInfo() {
  return chrome.runtime.getManifest();
}

export async function openAboutDialog() {
  const dialog = document.getElementById('about-dialog');
  const placeholder = dialog.querySelector('smb-placeholder');
  const version = document.getElementById('about-version');
  const homepage_url = document.getElementById('about-homepage');
  const issues_url = document.getElementById('about-issues');
  const privacy_url = document.getElementById('about-privacy');
  const legalNotice = document.getElementById('about-legal-notice');

  try {
    const manifest = await getManifestInfo();

    placeholder.heading = manifest.name;
    placeholder.description = manifest.author;
    version.textContent = manifest.version;
    homepage_url.href = manifest.homepage_url;
  } catch (error) {
    console.error(error);
  }

  issues_url.href = ISSUES_URL;
  privacy_url.href = PRIVACY_POLICY_URL;

  const licenseName = t('gnuGpl3');
  const [before, after] = t('legalNotice', licenseName).split(licenseName);
  const license = document.createElement('a');

  license.href = LICENSE_URL;
  license.target = '_blank';
  license.rel = 'noopener';
  license.textContent = licenseName;

  legalNotice.replaceChildren(before, license, after);

  dialog.showModal();
}
