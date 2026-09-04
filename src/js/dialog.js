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

export function resetScroll(dialog) {
  const scrollableAreas = dialog.querySelectorAll('.scrollable-area');

  scrollableAreas.forEach(element => {
    element.scrollTo({
      top: 0,
      behavior: 'instant'
    });
  });
}

export function resetToasts(dialog) {
  const toasts = dialog.querySelectorAll('smb-toast');
  toasts.forEach(toast => toast.close());
}

export function bindDialogEvents() {
  document.addEventListener('toggle', (event) => {
    if (event.target?.localName !== 'smb-dialog') return;
    if (event.detail.newState !== 'open') return;

    resetScroll(event.target);
    resetToasts(event.target);
  });
}
