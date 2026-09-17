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
import styles from '../../css/styles.css' with { type: 'css' };
import component from './smb-search.css' with { type: 'css' };

import {
  applyTranslations,
} from '../../js/i18n.js';

const template = document.createElement('template');
template.innerHTML = `
  <div>
    <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" fill="currentColor"><path d="m777.65-143.89-247.89-248q-29.61 24.77-68.3 38.22-38.69 13.44-79.23 13.44-100.36 0-169.74-69.43-69.37-69.42-69.37-169.5 0-100.07 69.32-169.53 69.31-69.46 169.49-69.46t169.65 69.47q69.46 69.47 69.46 169.62 0 41.91-14.08 80.75-14.08 38.85-37.58 67.28l248 247.41-39.73 39.73Zm-395.57-252.3q76.8 0 129.9-53.02 53.1-53.03 53.1-130 0-76.98-53.1-129.98-53-53-130-53t-129.9 53.02-53 130q0 76.98 53.01 129.98 53.02 53.02 129.99 53Z"/></svg>
    <input type="search">
    <button class="button small suggested-action" type="button" data-i18n-attr="aria-label:clearSearch">
      <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" fill="currentColor"><path d="m330.38-290.27-40.11-40.11L440.39-480 290.27-629.12l40.11-40.11L480-519.11l149.12-150.12 40.11 40.11L519.11-480l150.12 149.62-40.11 40.11L480-440.39 330.38-290.27Z"/></svg>
    </button>
  </div>
`;

export class SmbSearch extends HTMLElement {
  #wrapper;
  #input;
  #clearButton;

  static get observedAttributes() {
    return ['placeholder', 'disabled', 'value', 'name', 'autofocus'];
  }

  constructor() {
    super();

    this.attachShadow({ mode: 'open' });
    this.shadowRoot.adoptedStyleSheets = [reset, styles, component];
    this.shadowRoot.appendChild(template.content.cloneNode(true));

    applyTranslations(this.shadowRoot);

    this.#wrapper = this.shadowRoot.querySelector('div');
    this.#input = this.shadowRoot.querySelector('input');
    this.#clearButton = this.shadowRoot.querySelector('button');

    this.#updateClearButton();

    this.#input.addEventListener('input', () => {
      this.#updateClearButton();
      this.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
    });

    this.#input.addEventListener('change', () => {
      this.#updateClearButton();
      this.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
    });

    this.#clearButton.addEventListener('click', () => this.#handleClear());
  }

  connectedCallback() {
    if (!this.hasAttribute('autofocus')) return;

    requestAnimationFrame(() => {
      requestAnimationFrame(() => this.#input.focus());
    });
  }

  attributeChangedCallback(name, _, newValue) {
    if (name === 'placeholder') {
      this.#input.placeholder = newValue ?? '';
    }

    if (name === 'disabled') {
      this.#input.disabled = newValue !== null;
    }

    if (name === 'value') {
      this.#input.value = newValue ?? '';
      this.#updateClearButton();
    }

    if (name === 'name') {
      this.#input.name = newValue ?? '';
    }

    if (name === 'autofocus') {
      this.#input.autofocus = newValue !== null;
    }
  }

  #updateClearButton() {
    this.#clearButton.dataset.visible = String(Boolean(this.#input.value));
  }

  #handleClear() {
    const clearEvent = new CustomEvent('clear', {
      bubbles: true,
      composed: true,
      cancelable: true,
      detail: { action: this.dataset.clearAction ?? null },
    });

    this.dispatchEvent(clearEvent);

    if (this.dataset.clearAction !== undefined) return;
    if (clearEvent.defaultPrevented) return;

    this.clear();
  }

  clear() {
    this.#input.value = '';
    this.#updateClearButton();
    this.#input.focus();
    this.#input.dispatchEvent(new Event('input', { bubbles: true }));
  }

  get value() {
    return this.#input.value;
  }

  set value(newValue) {
    this.#input.value = newValue ?? '';
    this.#updateClearButton();
  }

  get placeholder() {
    return this.getAttribute('placeholder') ?? '';
  }

  set placeholder(newValue) {
    this.setAttribute('placeholder', newValue ?? '');
  }

  get disabled() {
    return this.hasAttribute('disabled');
  }

  set disabled(isDisabled) {
    this.toggleAttribute('disabled', Boolean(isDisabled));
  }

  focus() {
    this.#input.focus();
  }
}

customElements.define('smb-search', SmbSearch);
