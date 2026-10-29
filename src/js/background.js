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
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 */

const EXPANDER_SCRIPT_ID = 'expander';

let openingPromise;
let expanderQueue = Promise.resolve();

chrome.action.onClicked.addListener(async () => {
  if (openingPromise) return;

  openingPromise = (async () => {
    try {
      const targetUrl = chrome.runtime.getURL('main.html');
      const { mainTabId } = await chrome.storage.local.get('mainTabId');

      if (mainTabId !== undefined) {
        try {
          const tab = await chrome.tabs.get(mainTabId);

          await chrome.tabs.update(tab.id, { active: true });
          await chrome.windows.update(tab.windowId, { focused: true });

          return;
        } catch {
          await chrome.storage.local.remove('mainTabId');
        }
      }

      const tab = await chrome.tabs.create({ url: targetUrl });

      if (tab.id !== undefined) {
        await chrome.storage.local.set({ mainTabId: tab.id });
      }
    } catch (error) {
      console.error(error);
    } finally {
      openingPromise = undefined;
    }
  })();

  await openingPromise;
});

chrome.tabs.onRemoved.addListener(async (tabId) => {
  try {
    const { mainTabId } = await chrome.storage.local.get('mainTabId');

    if (tabId === mainTabId)
      await chrome.storage.local.remove('mainTabId');
  } catch (error) {
    console.error(error);
  }
});

function updateExpander() {
  expanderQueue = expanderQueue.then(async () => {
    try {
      const { userPreferences } = await chrome.storage.local.get('userPreferences');
      const isEnabled = userPreferences?.textExpansion?.enabled ?? true;
      const registered = await chrome.scripting.getRegisteredContentScripts({
        ids: [EXPANDER_SCRIPT_ID],
      });

      if (isEnabled && registered.length === 0) {
        await chrome.scripting.registerContentScripts([{
          id: EXPANDER_SCRIPT_ID,
          matches: ['<all_urls>'],
          js: ['js/expander.js'],
          allFrames: true,
          runAt: 'document_idle',
          persistAcrossSessions: true,
        }]);
      } else if (!isEnabled && registered.length > 0) {
        await chrome.scripting.unregisterContentScripts({
          ids: [EXPANDER_SCRIPT_ID],
        });
      }
    } catch (error) {
      console.error(error);
    }
  });
}

chrome.runtime.onInstalled.addListener(updateExpander);
chrome.runtime.onStartup.addListener(updateExpander);

chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== 'local' || !changes.userPreferences) return;

  const wasEnabled = changes.userPreferences.oldValue?.textExpansion?.enabled ?? true;
  const isEnabled = changes.userPreferences.newValue?.textExpansion?.enabled ?? true;

  if (wasEnabled !== isEnabled) updateExpander();
});
