/**
 * Samambaia - A simple scripts manager.
 * Copyright (C) 2026 Raul Sousa
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 */

import {
  applyTranslations,
  getLocale,
} from './i18n.js';

const actions = {
  change: {},

  click: {},

  input: {},

  submit: {},
};

function handleAction(event, actions) {
  const element = event.target.closest('[data-action]');
  if (!element) return;

  const { action } = element.dataset;
  const eventType = event.type;

  const handler = actions[eventType]?.[action];
  if (!handler) return;

  if (event.type === 'submit') event.preventDefault();

  const param = eventType === 'change' ? event.target.value : element;
  handler(param, event, element);
}

async function init() {
  document.documentElement.lang = getLocale();

  applyTranslations();
}

function bindEvents() {
  document.addEventListener('click', (e) => handleAction(e, actions));
  document.addEventListener('change', (e) => handleAction(e, actions));
  document.addEventListener('input', (e) => handleAction(e, actions));
  document.addEventListener('submit', (e) => handleAction(e, actions));
}

bindEvents();
init();
