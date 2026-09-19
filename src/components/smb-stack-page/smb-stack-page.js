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
import component from './smb-stack-page.css' with { type: 'css' };

class SmbStackPage extends HTMLElement {
  constructor() {
    super();

    this.attachShadow({ mode: 'open' });

    this.shadowRoot.adoptedStyleSheets = [reset, component];

    this.shadowRoot.innerHTML = `
      <slot></slot>
    `;
  }

  connectedCallback() {
    this.setAttribute('role', 'tabpanel');
  }

  get pageName() {
    return this.getAttribute('page-name');
  }
}

customElements.define('smb-stack-page', SmbStackPage);
