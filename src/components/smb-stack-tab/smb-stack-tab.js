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
import component from './smb-stack-tab.css' with { type: 'css' };

import {
  applyTranslations,
} from '../../js/i18n.js';

class SmbStackTab extends HTMLElement {
  #stack;
  #title;

  constructor() {
    super();

    this.attachShadow({ mode: 'open' });

    this.shadowRoot.adoptedStyleSheets = [reset, component];

    this.shadowRoot.innerHTML = `
      <div>
        <div class="icon">
          <slot name="icon" aria-hidden="true"></slot>
        </div>
        <span></span>
      </div>
    `;

    this.#title = this.shadowRoot.querySelector('span');

    this.addEventListener('click', this.#handleClick);
    this.addEventListener('keydown', this.#handleKeyDown);
  }

  connectedCallback() {
    this.setAttribute('role', 'tab');

    this.#stack = document.getElementById(this.getAttribute('target'));

    const pageName = this.getAttribute('page-name');
    const page = this.#stack?.pages.find(
      page => page.pageName === pageName
    );

    if (this.#stack && page) {
      if (!this.id)
        this.id = `${this.#stack.id}-${pageName}-tab`;

      if (!page.id)
        page.id = `${this.#stack.id}-${pageName}-tabpanel`;

      this.setAttribute('aria-controls', page.id);
      page.setAttribute('aria-labelledby', this.id);

      const pageTitle = page.getAttribute('page-title');

      this.#title.dataset.i18n = pageTitle ?? '';
      applyTranslations(this.shadowRoot);
    }
  }

  disconnectedCallback() {
    this.#stack = null;
  }

  #handleClick = () => {
    const pageName = this.getAttribute('page-name');

    this.#stack?.show(pageName);
  };

  #handleKeyDown = (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();

      this.#stack?.show(this.getAttribute('page-name'));

      return;
    }

    const switcher = this.closest('smb-stack-switcher');
    const tabs = switcher
      ? [...switcher.querySelectorAll('smb-stack-tab')]
      : [];

    if (!tabs.length) return;

    const index = tabs.indexOf(this);

    if (index === -1) return;

    let nextIndex;

    if (event.key === 'ArrowRight')
      nextIndex = (index + 1) % tabs.length;

    if (event.key === 'ArrowLeft')
      nextIndex = (index - 1 + tabs.length) % tabs.length;

    if (event.key === 'Home')
      nextIndex = 0;

    if (event.key === 'End')
      nextIndex = tabs.length - 1;

    if (nextIndex === undefined) return;

    event.preventDefault();

    const nextTab = tabs[nextIndex];

    this.#stack?.show(nextTab.getAttribute('page-name'));
    nextTab.focus();
  };

  update(pageName) {
    const isActive = this.getAttribute('page-name') === pageName;

    this.setAttribute('aria-selected', isActive ? 'true' : 'false');
    this.setAttribute('tabindex', isActive ? '0' : '-1');
  }
}

customElements.define('smb-stack-tab', SmbStackTab);
