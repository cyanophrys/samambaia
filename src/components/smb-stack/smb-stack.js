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
import component from './smb-stack.css' with { type: 'css' };

import '../smb-stack-page/smb-stack-page.js';

class SmbStack extends HTMLElement {
  #pages;
  #slot;
  #initialized = false;

  constructor() {
    super();

    this.attachShadow({ mode: 'open' });

    this.shadowRoot.adoptedStyleSheets = [reset, component];

    this.shadowRoot.innerHTML = `
      <slot></slot>
    `;

    this.#slot = this.shadowRoot.querySelector('slot');
    this.#slot.addEventListener('slotchange', this.#handleSlotChange);
  }

  connectedCallback() {
    if (this.pages.length)
      this.#initialize();
  }

  get pages() {
    if (!this.#pages) {
      this.#pages = [...this.children].filter(
        child => child.matches?.('smb-stack-page') && child.pageName
      );
    }

    return this.#pages;
  }

  #handleSlotChange = () => {
    this.#pages = null;

    if (this.pages.length)
      this.#initialize();
  };

  #initialize() {
    if (this.#initialized) return;

    const name = this.getAttribute('active-page-name') ?? this.pages[0].pageName;

    if (!name) return;

    this.#initialized = true;

    this.show(name);
  }

  show(name) {
    const pages = this.pages;
    const pageExists = pages.some(
      page => page.pageName === name
    );

    if (!pageExists) return;

    for (const page of pages) {
      const isActive = page.pageName === name;

      page.toggleAttribute('data-active', isActive);

      if (!this.hasAttribute('homogeneous') && !this.hasAttribute('transition'))
        page.hidden = !isActive;
    }

    this.dispatchEvent(new CustomEvent('stack-change', {
      detail: { page: name },
      bubbles: true,
      composed: true,
    }));
  }
}

customElements.define('smb-stack', SmbStack);
