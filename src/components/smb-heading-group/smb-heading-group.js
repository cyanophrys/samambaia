/**
 * Copyright (C) 2026 Raul Sousa
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published
 * by the Free Software Foundation, either version 3 of the License,
 * or (at your option) any later version.
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
import styles from './smb-heading-group.css' with { type: 'css' };

import {
  applyTranslations,
} from '../../js/i18n.js';

const template = document.createElement('template');
template.innerHTML = `
  <div>
    <slot name="icon" aria-hidden="true"></slot>
    <h1></h1>
    <span></span>
    <slot name="additional-content"></slot>
  </div>
`;

export class SmbHeadingGroup extends HTMLElement {
  #container;
  #heading;
  #description;
  #additionalContent;

  static get observedAttributes() {
    return ['heading', 'description', 'compact', 'page'];
  }

  constructor() {
    super();

    this.attachShadow({ mode: 'open' });
    this.shadowRoot.adoptedStyleSheets = [reset, common, styles];
    this.shadowRoot.appendChild(template.content.cloneNode(true));

    this.#container = this.shadowRoot.querySelector('div');
    this.#heading = this.shadowRoot.querySelector('h1');
    this.#description = this.shadowRoot.querySelector('span');
    const slots = this.shadowRoot.querySelectorAll('slot');
    const updateSlots = () => {
      for (const slot of slots)
        slot.hidden = !slot.assignedElements({ flatten: true }).length;
    };

    for (const slot of slots)
      slot.addEventListener('slotchange', updateSlots);

    updateSlots();
  }

  attributeChangedCallback(name, _, newValue) {
    if (name === 'heading') {
      this.#heading.dataset.i18n = newValue ?? '';
      applyTranslations(this.shadowRoot);
    }

    if (name === 'description') {
      this.#description.dataset.i18n = newValue ?? '';
      applyTranslations(this.shadowRoot);
    }
  }

  get heading() {
    return this.#heading.textContent;
  }

  set heading(value) {
    this.#heading.removeAttribute('data-i18n');
    this.#heading.textContent = value ?? '';
  }

  get description() {
    return this.#description.textContent;
  }

  set description(value) {
    this.#description.removeAttribute('data-i18n');
    this.#description.textContent = value ?? '';
  }

  get compact() {
    return this.hasAttribute('compact');
  }

  set compact(isCompact) {
    this.toggleAttribute('compact', Boolean(isCompact));
  }

  get page() {
    return this.hasAttribute('page');
  }

  set page(isPage) {
    this.toggleAttribute('page', Boolean(isPage));
  }
}

customElements.define('smb-heading-group', SmbHeadingGroup);
