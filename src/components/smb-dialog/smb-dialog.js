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
import component from './smb-dialog.css' with { type: 'css' };

import {
  applyTranslations,
} from '../../js/i18n.js';

const template = document.createElement('template');
template.innerHTML = `
  <dialog id="dialog" aria-labelledby="heading">
    <header class="header">
      <slot name="header-left"></slot>
      <div class="heading">
        <h4 id="heading"></h4>
        <span id="subtitle"></span>
      </div>
      <slot name="header-right"></slot>
      <button id="close-button" class="button small" type="button" data-i18n-attr="aria-label:close">
        <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" height="22px" viewBox="0 -960 960 960" width="22px" fill="currentColor"><path d="m330.38-290.27-40.11-40.11L440.39-480 290.27-629.12l40.11-40.11L480-519.11l149.12-150.12 40.11 40.11L519.11-480l150.12 149.62-40.11 40.11L480-440.39 330.38-290.27Z"/></svg>
      </button>
      <slot name="subheader"></slot>
    </header>
    <slot></slot>
    <footer class="footer">
      <slot name="footer-left"></slot>
      <slot name="footer-center"></slot>
      <slot name="footer-right"></slot>
    </footer>
  </dialog>
`;

export class SmbDialog extends HTMLElement {
  #dialog;
  #heading;
  #subtitle;

  constructor() {
    super();

    this.attachShadow({ mode: 'open' });
    this.shadowRoot.adoptedStyleSheets = [reset, styles, component];
    this.shadowRoot.appendChild(template.content.cloneNode(true));

    applyTranslations(this.shadowRoot);

    this.#dialog = this.shadowRoot.getElementById('dialog');
    this.#heading = this.shadowRoot.getElementById('heading');
    this.#subtitle = this.shadowRoot.getElementById('subtitle');

    const closeButton = this.shadowRoot.getElementById('close-button');
    closeButton.addEventListener('click', () => this.close());

    this.addEventListener('click', (event) => {
      if (event.target.closest('[data-dialog-close]'))
        this.close();
    });

    const footer = this.shadowRoot.querySelector('footer');
    const slots = this.shadowRoot.querySelectorAll('slot[name]');
    const footerSlots = footer.querySelectorAll('slot[name]');

    const updateSlots = () => {
      for (const slot of slots)
        slot.hidden = !slot.assignedElements({ flatten: true }).length;

      footer.hidden = ![...footerSlots].some(slot => !slot.hidden);
    };

    for (const slot of slots)
      slot.addEventListener('slotchange', updateSlots);

    updateSlots();

    this.#dialog.addEventListener('toggle', (event) => {
      this.dispatchEvent(new CustomEvent('toggle', {
        detail: {
          oldState: event.oldState,
          newState: event.newState,
        },
        bubbles: true,
        composed: true,
      }));
    });

    for (const type of ['close', 'cancel']) {
      this.#dialog.addEventListener(type, () => {
        this.dispatchEvent(new Event(type, {
          bubbles: true,
          composed: true,
        }));
      });
    }
  }

  static get observedAttributes() {
    return ['heading', 'subtitle'];
  }

  attributeChangedCallback(name, _, newValue) {
    if (name === 'heading') {
      this.#heading.textContent = newValue ?? '';
    }

    if (name === 'subtitle') {
      this.#subtitle.textContent = newValue ?? '';

      if (newValue)
        this.#dialog.setAttribute('aria-describedby', 'subtitle');
      else
        this.#dialog.removeAttribute('aria-describedby');
    }
  }

  get heading() {
    return this.getAttribute('heading') ?? '';
  }

  set heading(value) {
    this.setAttribute('heading', value ?? '');
  }

  get subtitle() {
    return this.getAttribute('subtitle') ?? '';
  }

  set subtitle(value) {
    this.setAttribute('subtitle', value ?? '');
  }

  get open() {
    return this.#dialog.open;
  }

  showModal() {
    this.#dialog.showModal();
    return this;
  }

  close() {
    this.#dialog.close();
    return this;
  }
}

customElements.define('smb-dialog', SmbDialog);
