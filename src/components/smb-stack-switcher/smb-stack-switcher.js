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
import component from './smb-stack-switcher.css' with { type: 'css' };

import '../smb-stack-tab/smb-stack-tab.js';

class SmbStackSwitcher extends HTMLElement {
  #stack;

  constructor() {
    super();

    this.attachShadow({ mode: 'open' });

    this.shadowRoot.adoptedStyleSheets = [reset, component];

    this.shadowRoot.innerHTML = `
      <slot></slot>
    `;
  }

  connectedCallback() {
    this.setAttribute('role', 'tablist');

    this.#stack = document.getElementById(this.getAttribute('target'));

    if (!this.#stack) return;

    this.#stack.addEventListener('stack-change', this.#handleStackChange);

    this.#render(this.#stack);
  }

  disconnectedCallback() {
    this.#stack?.removeEventListener(
      'stack-change',
      this.#handleStackChange
    );

    this.#stack = null;
  }

  #handleStackChange = event => {
    this.update(event.detail.page);
  };

  #render(stack) {
    const target = this.getAttribute('target');
    const fragment = document.createDocumentFragment();

    for (const page of stack.pages) {
      const pageName = page.pageName;

      if (!pageName) continue;

      const tab = document.createElement('smb-stack-tab');
      const icon = page.querySelector('[slot="icon"]');

      tab.setAttribute('target', target);
      tab.setAttribute('page-name', pageName);

      if (icon) {
        const iconClone = icon.cloneNode(true);

        iconClone.setAttribute('slot', 'icon');

        tab.append(iconClone);
      }

      fragment.append(tab);
    }

    this.replaceChildren(fragment);

    const activePage = stack.pages.find(
      page => page.hasAttribute('data-active')
    );

    this.update(activePage?.pageName);
  }

  update(pageName) {
    for (const tab of this.querySelectorAll('smb-stack-tab'))
      tab.update(pageName);
  }
}

customElements.define('smb-stack-switcher', SmbStackSwitcher);
