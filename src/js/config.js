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

export const ACCENT_COLORS = [
  'blue',
  'teal',
  'green',
  'yellow',
  'brown',
  'orange',
  'lavender',
  'red',
  'pink',
  'purple',
  'slate',
];

export const DEFAULT_PREFERENCES = {
  accentColor: 'blue',
  highContrast: false,
  largeText: false,
  sidebars: {
    labels: true,
    variables: false,
  },
  theme: 'system',
  viewMode: 'grid',
};

export const LIMITS = {
  MAX_LABEL_NAME_LENGTH: 128,
  MAX_SCRIPT_NAME_LENGTH: 128,
  MAX_SCRIPT_CONTENT_LENGTH: 5000,
  MAX_VARIABLE_NAME_LENGTH: 128,
};

export const PSEUDO_LABELS = [
  'all',
];

export const VARIABLE_TOKEN_PATTERN = /\{\{\s*([a-zA-Z0-9_-]+)\s*\}\}/g;
