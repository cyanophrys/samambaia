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
import toast from './smb-toast.css' with { type: 'css' };

const DEFAULT_DURATION = 5000;
const DEFAULT_MAX_TOASTS = 3;

const template = document.createElement('template');
template.innerHTML = `
  <div role="status" aria-live="polite">
    <span class="message"></span>
    <button type="button" class="button close-button" aria-label="Close">
      <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" height="22px" viewBox="0 -960 960 960" width="22px" fill="currentColor"><path d="m330.38-290.27-40.11-40.11L440.39-480 290.27-629.12l40.11-40.11L480-519.11l149.12-150.12 40.11 40.11L519.11-480l150.12 149.62-40.11 40.11L480-440.39 330.38-290.27Z"/></svg>
    </button>
  </div>
`;

export class SmbToast extends HTMLElement {
  #toast;
  #message;
  #closeButton;
  #actionButton;
  #timeoutId = null;
  #fallbackId = null;
  #closeHandler = null;
  #removed = false;
  #hovered = false;
  #focused = false;
  #remainingTime = DEFAULT_DURATION;
  #startTime = null;
  #duration = DEFAULT_DURATION;
  #closeGeneration = 0;

  static maxToasts = DEFAULT_MAX_TOASTS;

  constructor() {
    super();

    this.attachShadow({ mode: 'open' });
    this.shadowRoot.adoptedStyleSheets = [reset, common, toast];
    this.shadowRoot.appendChild(template.content.cloneNode(true));

    this.#toast = this.shadowRoot.querySelector('div');
    this.#message = this.shadowRoot.querySelector('.message');
    this.#closeButton = this.shadowRoot.querySelector('.close-button');

    this.#closeButton.addEventListener('click', () => this.close());

    this.#toast.addEventListener('mouseenter', () => {
      this.#hovered = true;
      this.#pauseTimer();
    });

    this.#toast.addEventListener('mouseleave', () => {
      this.#hovered = false;
      this.#resumeTimer();
    });

    this.#toast.addEventListener('focusin', () => {
      this.#focused = true;
      this.#pauseTimer();
    });

    this.#toast.addEventListener('focusout', (event) => {
      if (!this.#toast.contains(event.relatedTarget)) {
        this.#focused = false;
        this.#resumeTimer();
      }
    });
  }

  static get observedAttributes() {
    return ['toast-message', 'type'];
  }

  attributeChangedCallback(name, _, newValue) {
    if (name === 'toast-message') {
      this.#message.textContent = newValue ?? '';
    } else if (name === 'type') {
      if (newValue === 'error') {
        this.#toast.setAttribute('role', 'alert');
        this.#toast.setAttribute('aria-live', 'assertive');
      } else {
        this.#toast.setAttribute('role', 'status');
        this.#toast.setAttribute('aria-live', 'polite');
      }
    }
  }

  get message() {
    return this.getAttribute('toast-message') ?? '';
  }

  set message(value) {
    this.setAttribute('toast-message', value ?? '');
  }

  get type() {
    return this.getAttribute('type') ?? 'status';
  }

  set type(value) {
    this.setAttribute('type', value ?? 'status');
  }

  get duration() {
    return this.#duration;
  }

  set duration(value) {
    this.#duration = Number.isFinite(Number(value))
      ? Math.max(0, Number(value))
      : DEFAULT_DURATION;
  }

  get isClosing() {
    return this.#removed;
  }

  #pauseTimer() {
    if (!this.#timeoutId) return;

    clearTimeout(this.#timeoutId);
    this.#timeoutId = null;

    if (this.#startTime !== null) {
      const elapsed = Date.now() - this.#startTime;
      this.#remainingTime = Math.max(0, this.#remainingTime - elapsed);
      this.#startTime = null;
    }
  }

  #resumeTimer() {
    if (
      this.#removed ||
      this.#duration <= 0 ||
      this.#hovered ||
      this.#focused ||
      this.#timeoutId
    ) {
      return;
    }

    if (this.#remainingTime > 0) {
      this.#startTime = Date.now();
      this.#timeoutId = setTimeout(() => this.close(), this.#remainingTime);
    }
  }

  #clearCloseHandler() {
    if (!this.#closeHandler) return;

    this.#toast.removeEventListener('transitionend', this.#closeHandler);
    this.#closeHandler = null;
  }

  #enforceMaxToasts(container) {
    const limit = SmbToast.maxToasts;
    if (!limit || limit <= 0) return;

    const existingToasts = Array.from(
      container.querySelectorAll('smb-toast')
    ).filter((el) => el !== this && !el.isClosing);

    while (existingToasts.length >= limit) {
      const oldest = existingToasts.shift();
      oldest?.close();
    }
  }

  addAction(label, handler) {
    this.#actionButton?.remove();

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'button';
    button.textContent = label;

    button.addEventListener('click', () => {
      try {
        handler();
      } finally {
        this.close();
      }
    });

    this.#actionButton = button;
    this.#toast.insertBefore(button, this.#closeButton);

    return this;
  }

  show(target) {
    const container = typeof target === 'string'
      ? document.getElementById(target)
      : target;

    if (!container) return this;

    this.#enforceMaxToasts(container);

    if (this.parentElement !== container) {
      container.appendChild(this);
    }

    this.#closeGeneration++;
    this.#clearCloseHandler();

    if (this.#fallbackId) {
      clearTimeout(this.#fallbackId);
      this.#fallbackId = null;
    }

    this.#removed = false;
    this.#remainingTime = this.#duration;
    this.#startTime = null;

    if (this.#timeoutId) {
      clearTimeout(this.#timeoutId);
      this.#timeoutId = null;
    }

    requestAnimationFrame(() => {
      if (!this.#removed) {
        this.#toast.setAttribute('data-visible', 'true');
      }
    });

    this.#resumeTimer();

    return this;
  }

  close() {
    if (this.#removed) return;

    this.#removed = true;
    this.#closeGeneration++;

    const generation = this.#closeGeneration;

    if (this.#timeoutId) {
      clearTimeout(this.#timeoutId);
      this.#timeoutId = null;
    }

    this.#startTime = null;

    this.#clearCloseHandler();

    const remove = (event) => {
      if (generation !== this.#closeGeneration || !this.#removed) return;

      if (event && event.target !== this.#toast) return;

      this.#clearCloseHandler();

      if (this.#fallbackId) {
        clearTimeout(this.#fallbackId);
        this.#fallbackId = null;
      }

      this.dispatchEvent(new Event('close', { bubbles: true, composed: true }));
      this.remove();
    };

    this.#closeHandler = remove;
    this.#toast.addEventListener('transitionend', remove);

    this.#toast.setAttribute('data-visible', 'false');

    this.#fallbackId = setTimeout(() => remove(), 300);
  }
}

customElements.define('smb-toast', SmbToast);
