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

import reset from '../../css/reset.css' with { type: 'css' };
import common from '../../css/common.css' with { type: 'css' };
import styles from './smb-stack.css' with { type: 'css' };

class SmbStack extends HTMLElement {
  constructor() {
    super();

    this.attachShadow({ mode: 'open' });

    this.shadowRoot.adoptedStyleSheets = [reset, common, styles];

    this.shadowRoot.innerHTML = `
      <slot></slot>
    `;
  }

  #handleSwitcherClick = (event) => {
    const button = event.target.closest(`.stack-switcher[data-target="${this.id}"][data-page-name]`);
    if (!button) return;

    this.show(button.dataset.pageName);
  };

  connectedCallback() {
    document.addEventListener('click', this.#handleSwitcherClick);
    this.show(this.getAttribute('active-page-name') ?? this.pages[0]?.getAttribute('data-page-name'));
  }

  disconnectedCallback() {
    document.removeEventListener('click', this.#handleSwitcherClick);
  }

  get pages() {
    return [...this.children].filter(
      child => child.hasAttribute?.('data-page-name')
    );
  }

  get buttons() {
    return document.querySelectorAll(
      `[data-target="${this.id}"][data-page-name]`
    );
  }

  show(name) {
    const pageExists = this.pages.some(
      page => page.getAttribute('data-page-name') === name
    );

    if (!pageExists) return;

    for (const page of this.pages) {
      const isActive = page.getAttribute('data-page-name') === name;

      page.toggleAttribute('data-active', isActive);
      page.setAttribute('role', 'tabpanel');
      page.setAttribute('aria-hidden', !isActive);

      if (!this.hasAttribute('homogeneous') && !this.hasAttribute('transition'))
        page.hidden = !isActive;
    }

    for (const button of this.buttons) {
      const isActive = button.dataset.pageName === name;
      button.setAttribute('aria-selected', isActive ? 'true' : 'false');
    }

    this.dispatchEvent(new CustomEvent('stack-change', {
      detail: { page: name },
      bubbles: true,
      composed: true,
    }));
  }
}

customElements.define('smb-stack', SmbStack);
