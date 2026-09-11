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

export function getManifestInfo() {
  return chrome.runtime.getManifest();
}

export async function openAboutDialog() {
  const dialog = document.getElementById('about-dialog');
  const name = dialog.querySelector('#about-name');
  const version = dialog.querySelector('#about-version');
  const author = dialog.querySelector('#about-author');
  const homepage_url = dialog.querySelector('#about-homepage');

  try {
    const manifest = await getManifestInfo();

    name.textContent = manifest.name;
    version.textContent = manifest.version;
    author.textContent = manifest.author;
    homepage_url.href = manifest.homepage_url;
    homepage_url.textContent = manifest.homepage_url;
  } catch (error) {
    console.error(error);
  }

  dialog.showModal();
}
