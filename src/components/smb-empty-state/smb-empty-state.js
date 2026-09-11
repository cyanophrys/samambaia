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
import emptyState from './smb-empty-state.css' with { type: 'css' };

import {
  applyTranslations,
} from '../../js/i18n.js';

const template = document.createElement('template');
template.innerHTML = `
  <div>
    <slot name="icon"></slot>
    <h1></h1>
    <span></span>
    <slot name="additional-content"></slot>
  </div>
`;

export class SmbEmptyState extends HTMLElement {
  #container;
  #title;
  #description;

  static get observedAttributes() {
    return ['heading', 'description', 'compact'];
  }

  constructor() {
    super();

    this.attachShadow({ mode: 'open' });
    this.shadowRoot.adoptedStyleSheets = [reset, common, emptyState];
    this.shadowRoot.appendChild(template.content.cloneNode(true));

    this.#container = this.shadowRoot.querySelector('div');
    this.#title = this.shadowRoot.querySelector('h1');
    this.#description = this.shadowRoot.querySelector('span');
  }

  attributeChangedCallback(name, _, newValue) {
    if (name === 'heading') {
      this.#title.dataset.i18n = newValue ?? '';
      applyTranslations(this.shadowRoot);
    }

    if (name === 'description') {
      this.#description.dataset.i18n = newValue ?? '';
      applyTranslations(this.shadowRoot);
    }

    if (name === 'compact')
      this.#container.classList.toggle('compact', newValue !== null);
  }

  get heading() {
    return this.getAttribute('heading') ?? '';
  }

  set heading(value) {
    this.setAttribute('heading', value ?? '');
  }

  get description() {
    return this.getAttribute('description') ?? '';
  }

  set description(value) {
    this.setAttribute('description', value ?? '');
  }

  get compact() {
    return this.hasAttribute('compact');
  }

  set compact(isCompact) {
    this.toggleAttribute('compact', Boolean(isCompact));
  }
}

customElements.define('smb-empty-state', SmbEmptyState);
