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

export function bindMenuBehaviors() {
  document.addEventListener('keydown', handleMenuKeyboardNav);
  document.addEventListener('toggle', handlePopoverToggle, true);
}

function handleMenuKeyboardNav(event) {
  const menu = event.target.closest('.menu[role="menu"]:popover-open');
  if (!menu) return;

  const items = [...menu.querySelectorAll('[role="menuitem"]:not(:disabled)')];
  if (!items.length) return;

  const currentIndex = items.indexOf(document.activeElement);
  const focusAt = (i) => items[(i + items.length) % items.length].focus();

  if (event.key === 'ArrowDown') {
    event.preventDefault();
    focusAt(currentIndex + 1);
  } else if (event.key === 'ArrowUp') {
    event.preventDefault();
    focusAt(currentIndex - 1);
  } else if (event.key === 'Home') {
    event.preventDefault();
    focusAt(0);
  } else if (event.key === 'End') {
    event.preventDefault();
    focusAt(items.length - 1);
  }
}

function handlePopoverToggle(event) {
  const popover = event.target;

  if (!(popover instanceof HTMLElement) || !popover.hasAttribute('popover'))
    return;

  if (popover.getAttribute('role') === 'menu' && event.newState === 'open') {
    const item = popover.querySelector('[role="menuitem"]:not(:disabled)');

    requestAnimationFrame(() => {
      if (popover.contains(document.activeElement)) return;
      item?.focus();
    });
  }

  const invokers = document.querySelectorAll(
    `[popovertarget="${CSS.escape(popover.id)}"]:not([popovertargetaction="hide"])`
  );

  invokers.forEach((invoker) => {
    invoker.setAttribute('aria-expanded', String(event.newState === 'open'));
  });
}
