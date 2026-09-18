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

const locales = [
  'en',
];

export function applyTranslations(root = document) {
  root.querySelectorAll('[data-i18n]').forEach(el => {
    el.textContent = chrome.i18n.getMessage(el.dataset.i18n);
  });

  root.querySelectorAll('[data-i18n-attr]').forEach(el => {
    el.dataset.i18nAttr.split('|').forEach(pair => {
      const [attr, key] = pair.split(':');
      el.setAttribute(attr, chrome.i18n.getMessage(key));
    });
  });
}

export function t(key, substitutions) {
  return chrome.i18n.getMessage(key, substitutions);
}

export function getLocale() {
  const locale = chrome.i18n.getUILanguage().replace('-', '_');

  if (locales.includes(locale))
    return locale;

  const language = locale.split('_')[0];

  if (locales.includes(language))
    return language;

  return 'en';
}
