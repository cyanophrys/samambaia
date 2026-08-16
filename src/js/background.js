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

let openingPromise;

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
