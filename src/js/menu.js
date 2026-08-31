export function bindMenuBehaviors() {
  document.addEventListener('keydown', handleMenuKeyboardNav);
  document.addEventListener('toggle', handlePopoverToggle, true);
}

function handleMenuKeyboardNav(event) {
  const menu = event.target.closest('.menu[role="menu"]:popover-open');
  if (!menu) return;

  const items = [...menu.querySelectorAll('[role="menuitem"]:not(:disabled)')];
  if (!items.length) return;

  const currentIndex = items.indexOf(document.activeElement);
  const focusAt = (i) => items[(i + items.length) % items.length].focus();

  if (event.key === 'ArrowDown') {
    event.preventDefault();
    focusAt(currentIndex + 1);
  } else if (event.key === 'ArrowUp') {
    event.preventDefault();
    focusAt(currentIndex - 1);
  } else if (event.key === 'Home') {
    event.preventDefault();
    focusAt(0);
  } else if (event.key === 'End') {
    event.preventDefault();
    focusAt(items.length - 1);
  }
}

function handlePopoverToggle(event) {
  const popover = event.target;

  if (!(popover instanceof HTMLElement) || !popover.hasAttribute('popover'))
    return;

  if (popover.getAttribute('role') === 'menu' && event.newState === 'open') {
    requestAnimationFrame(() => {
      if (popover.contains(document.activeElement)) return;
      popover.querySelector('[role="menuitem"]:not(:disabled)')?.focus();
    });
  }

  const invokers = document.querySelectorAll(
    `[popovertarget="${CSS.escape(popover.id)}"]:not([popovertargetaction="hide"])`
  );

  invokers.forEach((invoker) => {
    invoker.setAttribute('aria-expanded', String(event.newState === 'open'));
  });
}
