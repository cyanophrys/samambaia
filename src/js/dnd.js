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

const SCROLL_EDGE_SIZE = 60;
const SCROLL_MAX_SPEED = 18;

export function makeSortable(container, {
  itemSelector,
  handleSelector = null,
  scrollContainer = container,
  canDrag = () => true,
} = {}) {
  let dragging = null;
  let pointerId = null;
  let originalNextSibling = null;
  let originalIndex = null;
  let scrollFrame = null;
  let scrollDelta = 0;

  function getItems() {
    return [...container.querySelectorAll(itemSelector)];
  }

  function updateIndices() {
    getItems().forEach((item, index) => {
      item.dataset.index = index;
    });
  }

  function getItemAtPoint(x, y) {
    return getItems().find(item => {
      const rect = item.getBoundingClientRect();

      return (
        x >= rect.left &&
        x <= rect.right &&
        y >= rect.top &&
        y <= rect.bottom
      );
    });
  }

  function moveDraggingItem(x, y) {
    const target = getItemAtPoint(x, y);

    if (!target || target === dragging)
      return;

    const draggingIndex = Number(dragging.dataset.index);
    const targetIndex = Number(target.dataset.index);

    if (Number.isNaN(draggingIndex) || Number.isNaN(targetIndex))
      return;

    if (draggingIndex === targetIndex)
      return;

    if (draggingIndex < targetIndex)
      target.after(dragging);
    else
      target.before(dragging);

    updateIndices();
  }

  function startAutoScroll() {
    if (scrollFrame) return;

    const step = () => {
      if (!dragging) {
        scrollFrame = null;
        return;
      }

      if (scrollDelta !== 0)
        scrollContainer.scrollTop += scrollDelta;

      scrollFrame = requestAnimationFrame(step);
    };

    scrollFrame = requestAnimationFrame(step);
  }

  function stopAutoScroll() {
    scrollDelta = 0;

    if (scrollFrame) {
      cancelAnimationFrame(scrollFrame);
      scrollFrame = null;
    }
  }

  function updateAutoScroll(clientY) {
    const rect = scrollContainer.getBoundingClientRect();
    const distanceFromTop = clientY - rect.top;
    const distanceFromBottom = rect.bottom - clientY;

    if (distanceFromTop < SCROLL_EDGE_SIZE) {
      const strength = 1 - Math.max(distanceFromTop, 0) / SCROLL_EDGE_SIZE;
      scrollDelta = -Math.ceil(strength * SCROLL_MAX_SPEED);
    } else if (distanceFromBottom < SCROLL_EDGE_SIZE) {
      const strength = 1 - Math.max(distanceFromBottom, 0) / SCROLL_EDGE_SIZE;
      scrollDelta = Math.ceil(strength * SCROLL_MAX_SPEED);
    } else {
      scrollDelta = 0;
    }
  }

  function removePointerListeners() {
    document.removeEventListener('pointermove', onPointerMove);
    document.removeEventListener('pointerup', endDrag);
    document.removeEventListener('pointercancel', endDrag);
  }

  function finishDrag(changed) {
    if (!dragging) return;

    dragging.releasePointerCapture?.(pointerId);
    dragging.removeAttribute('data-dragging');

    dragging = null;
    pointerId = null;
    originalNextSibling = null;

    stopAutoScroll();
    removePointerListeners();
    document.removeEventListener('keydown', onKeyDown);

    updateIndices();

    if (changed) {
      container.dispatchEvent(new CustomEvent('sort:changed', {
        bubbles: true,
        detail: { container },
      }));
    }

    originalIndex = null;
  }

  function cancelDrag() {
    if (!dragging) return;

    if (originalNextSibling)
      container.insertBefore(dragging, originalNextSibling);
    else
      container.append(dragging);

    finishDrag(false);
  }

  function onPointerMove(event) {
    if (!dragging || event.pointerId !== pointerId)
      return;

    updateAutoScroll(event.clientY);
    moveDraggingItem(event.clientX, event.clientY);
  }

  function endDrag() {
    if (!dragging) return;

    const currentIndex = Number(dragging.dataset.index);
    finishDrag(currentIndex !== originalIndex);
  }

  function onKeyDown(event) {
    if (event.key === 'Escape')
      cancelDrag();
  }

  function onPointerDown(event) {
    if (event.button !== 0 || !canDrag() || dragging)
      return;

    const item = event.target.closest(itemSelector);

    if (!item || !container.contains(item))
      return;

    if (handleSelector && !event.target.closest(handleSelector))
      return;

    updateIndices();

    dragging = item;
    pointerId = event.pointerId;
    originalIndex = Number(item.dataset.index);
    originalNextSibling = item.nextElementSibling;

    item.setAttribute('data-dragging', 'true');
    item.setPointerCapture?.(pointerId);

    document.addEventListener('pointermove', onPointerMove);
    document.addEventListener('pointerup', endDrag);
    document.addEventListener('pointercancel', endDrag);
    document.addEventListener('keydown', onKeyDown);

    startAutoScroll();
  }

  updateIndices();
  container.addEventListener('pointerdown', onPointerDown);

  return {
    destroy() {
      container.removeEventListener('pointerdown', onPointerDown);
      removePointerListeners();
      document.removeEventListener('keydown', onKeyDown);

      stopAutoScroll();

      if (dragging) {
        dragging.releasePointerCapture?.(pointerId);

        if (originalNextSibling)
          container.insertBefore(dragging, originalNextSibling);
        else
          container.append(dragging);

        dragging.removeAttribute('data-dragging');
        dragging = null;
        pointerId = null;
        originalNextSibling = null;
        originalIndex = null;

        updateIndices();
      }
    },
  };
}
