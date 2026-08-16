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
import dialog from './smb-alert-dialog.css' with { type: 'css' };

const template = document.createElement('template');
template.innerHTML = `
  <dialog id="dialog" role="alertdialog" aria-labelledby="dialog-title" aria-describedby="dialog-message">
    <div class="scrollable-area">
      <section class="section">
        <h2 id="dialog-title"></h2>
        <p id="dialog-message"></p>
      </section>
      <section class="section">
        <slot name="additional-content" id="additional-content"></slot>
      </section>
    </div>
    <footer id="actions" class="footer"></footer>
  </dialog>
`;

export class SmbAlertDialog extends HTMLElement {
  #dialog;
  #title;
  #message;
  #actionsContainer;
  #additionalSlot;
  #slotObserver;
  #responses = new Map();
  #buttons = new Map();
  #responseStates = new Map();
  #defaultResponse = null;
  #closeResponse = null;

  constructor() {
    super();

    this.attachShadow({ mode: 'open' });
    this.shadowRoot.adoptedStyleSheets = [reset, common, dialog];
    this.shadowRoot.appendChild(template.content.cloneNode(true));

    this.#dialog = this.shadowRoot.getElementById('dialog');
    this.#title = this.shadowRoot.getElementById('dialog-title');
    this.#message = this.shadowRoot.getElementById('dialog-message');
    this.#actionsContainer = this.shadowRoot.getElementById('actions');
    this.#additionalSlot = this.shadowRoot.getElementById('additional-content');

    const updateadditionalSlotVisibility = () => {
      const assigned = this.#additionalSlot.assignedNodes({ flatten: true });
      const hasContent = assigned.some(node =>
        node.nodeType === Node.ELEMENT_NODE
          ? !node.hasAttribute('hidden')
          : node.nodeType === Node.TEXT_NODE && node.textContent.trim() !== ''
      );

      this.#additionalSlot.parentElement.toggleAttribute('hidden', !hasContent);
    };

    this.#additionalSlot.addEventListener('slotchange', updateadditionalSlotVisibility);

    updateadditionalSlotVisibility();

    this.#slotObserver = new MutationObserver(() => updateadditionalSlotVisibility());
    this.#slotObserver.observe(this, {
      attributes: true,
      childList: true,
      subtree: true,
      attributeFilter: ['hidden']
    });

    this.#dialog.addEventListener('close', () => {
      let removed = false;
      const removeElement = () => {
        if (!removed) {
          removed = true;
          this.remove();
        }
      };

      this.#dialog.addEventListener('transitionend', removeElement, { once: true });
      setTimeout(removeElement, 300);
    });

    this.#dialog.addEventListener('cancel', e => {
      e.preventDefault();

      if (this.#closeResponse)
        this.#handleResponse(this.#closeResponse);
    });
  }

  connectedCallback() {
    if (!this.isConnected)
      document.body.appendChild(this);
  }

  disconnectedCallback() {
    this.#slotObserver?.disconnect();
  }

  static get observedAttributes() {
    return ['dialog-title', 'dialog-message'];
  }

  attributeChangedCallback(name, _, newValue) {
    if (name === 'dialog-title')
      this.#title.textContent = newValue ?? '';

    if (name === 'dialog-message')
      this.#message.textContent = newValue ?? '';
  }

  get title() {
    return this.getAttribute('dialog-title') ?? '';
  }

  set title(value) {
    this.setAttribute('dialog-title', value ?? '');
  }

  get message() {
    return this.getAttribute('dialog-message') ?? '';
  }

  set message(value) {
    this.setAttribute('dialog-message', value ?? '');
  }

  addResponses(responses) {
    for (const res of responses)
      this.addResponse(res.id, res.label, res.appearance, res.action);

    if (this.#responses.has('cancel')) {
      if (!this.#closeResponse)
        this.#closeResponse = 'cancel';

      if (!this.#defaultResponse)
        this.#defaultResponse = 'cancel';

      this.#renderButtons();
    }

    return this;
  }

  addResponse(id, label, appearance = 'default', action = null) {
    this.#responses.set(id, { id, label, appearance, action });
    this.#renderButtons();
    return this;
  }

  removeResponse(id) {
    this.#responses.delete(id);

    const button = this.#buttons.get(id);
    if (button) {
      button.remove();
      this.#buttons.delete(id);
    }

    if (this.#defaultResponse === id)
      this.#defaultResponse = null;

    if (this.#closeResponse === id)
      this.#closeResponse = null;

    return this;
  }

  setDefaultResponse(id) {
    this.#defaultResponse = id;
    this.#renderButtons();
    return this;
  }

  setCloseResponse(id) {
    this.#closeResponse = id;
    return this;
  }

  setResponseEnabled(id, enabled) {
    this.#responseStates.set(id, enabled);

    const button = this.#buttons.get(id);

    if (button)
      button.disabled = !enabled;

    return this;
  }

  #renderButtons() {
    for (const [id, res] of this.#responses) {
      let button = this.#buttons.get(id);

      if (!button) {
        button = document.createElement('button');
        button.type = 'button';
        button.classList.add('button', 'big');
        button.dataset.responseId = id;
        button.addEventListener('click', () => this.#handleResponse(id));
        this.#actionsContainer.appendChild(button);
        this.#buttons.set(id, button);
      }

      button.textContent = res.label;

      button.disabled = this.#responseStates.get(id) === false;

      button.classList.toggle(
        'suggested-action',
        res.appearance === 'suggested'
      );
      button.classList.toggle(
        'destructive-action',
        res.appearance === 'destructive'
      );
    }

    for (const [id, button] of this.#buttons)
      button.autofocus = id === this.#defaultResponse;
  }

  #handleResponse(responseId) {
    const config = this.#responses.get(responseId);

    if (config?.action)
      config.action(responseId);

    this.dispatchEvent(new CustomEvent('response', {
      detail: { response: responseId },
      bubbles: true,
      composed: true,
    }));

    this.close(responseId);
  }

  showModal() {
    if (!this.isConnected)
      document.body.appendChild(this);

    this.#dialog.showModal();

    return this;
  }

  close(returnValue) {
    this.#dialog.close(returnValue);

    return this;
  }
}

customElements.define('smb-alert-dialog', SmbAlertDialog);
