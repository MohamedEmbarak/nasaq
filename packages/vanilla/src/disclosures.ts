import { createCleanup, getNextEnabledIndex, isDisabled, normalizeSearch, restoreFocus } from '@nasaq/core';
import { createDialog, type DialogController, type DialogOptions } from './dialog.js';
import { emit, ensureId, eventElement, remember, required } from './dom.js';

export interface PopoverOptions { onOpenChange?: (open: boolean) => void; focusOnOpen?: boolean }
export interface PopoverController { readonly open: boolean; show(): void; close(restore?: boolean): void; destroy(): void }
export function createPopover(root: HTMLElement, options: PopoverOptions = {}): PopoverController {
  const trigger = required<HTMLElement>(root, '[data-nq-trigger]');
  const panel = required<HTMLElement>(root, '[data-nq-panel]');
  const scope = createCleanup();
  remember(scope, trigger, ['aria-expanded', 'aria-controls']); remember(scope, panel, ['hidden', 'role', 'tabindex']);
  trigger.setAttribute('aria-controls', ensureId(scope, panel, 'popover'));
  if (!panel.hasAttribute('role')) panel.setAttribute('role', 'region');
  let open = !panel.hidden;
  const render = () => { panel.hidden = !open; trigger.setAttribute('aria-expanded', String(open)); };
  const close = (restore = false) => { if (scope.destroyed || !open) return; open = false; render(); if (restore) restoreFocus(trigger); emit(root, { open }); options.onOpenChange?.(open); };
  const show = () => {
    if (scope.destroyed || open || isDisabled(trigger)) return; open = true; render();
    if (options.focusOnOpen) { const focus = panel.querySelector<HTMLElement>('input:not(:disabled), button:not(:disabled), a[href], select:not(:disabled), textarea:not(:disabled), [tabindex="0"]'); if (focus) focus.focus(); else { panel.tabIndex = -1; panel.focus(); } }
    emit(root, { open }); options.onOpenChange?.(open);
  };
  scope.listen(trigger, 'click', event => { if (isDisabled(trigger)) return; event.preventDefault(); if (open) close(); else show(); });
  scope.listen(root, 'click', event => { if (eventElement(event)?.closest('[data-nq-close]')) { event.preventDefault(); close(true); } });
  scope.listen(root, 'keydown', event => { if ((event as KeyboardEvent).key === 'Escape' && open) { event.preventDefault(); event.stopPropagation(); close(true); } });
  scope.listen(root.ownerDocument, 'pointerdown', event => { if (!root.contains(event.target as Node | null)) close(); });
  scope.listen(root, 'focusout', event => { const next = (event as FocusEvent).relatedTarget as Node | null; if (next && !root.contains(next)) close(); });
  render();
  return { get open() { return open; }, show, close, destroy() { if (scope.destroyed) return; if (open && panel.contains(root.ownerDocument.activeElement)) restoreFocus(trigger); scope.destroy(); } };
}

export interface MenuOptions { onSelect?: (value: string) => void }
export function createMenu(root: HTMLElement, options: MenuOptions = {}): PopoverController {
  const trigger = required<HTMLElement>(root, '[data-nq-trigger]'); const panel = required<HTMLElement>(root, '[data-nq-panel]');
  const items = [...panel.querySelectorAll<HTMLElement>('[role="menuitem"]')]; const scope = createCleanup();
  remember(scope, trigger, ['aria-haspopup']); remember(scope, panel, ['role']); trigger.setAttribute('aria-haspopup', 'menu'); panel.setAttribute('role', 'menu');
  items.forEach(item => { remember(scope, item, ['tabindex']); item.tabIndex = -1; });
  const disclosure = createPopover(root);
  const focus = (index: number) => { if (index < 0) return; items.forEach((item, position) => { item.tabIndex = position === index ? 0 : -1; }); items[index]!.focus(); };
  const navigate = (current: number, key: string) => focus(getNextEnabledIndex(current, key, items.map(item => ({ disabled: isDisabled(item) })), 'ltr', 'vertical'));
  let query = ''; let timer: ReturnType<typeof setTimeout> | undefined;
  scope.add(() => { if (timer !== undefined) clearTimeout(timer); });
  scope.listen(trigger, 'keydown', event => { const key = event as KeyboardEvent; if (isDisabled(trigger) || key.altKey || key.ctrlKey || key.metaKey) return; if (['ArrowDown', 'ArrowUp'].includes(key.key)) { event.preventDefault(); disclosure.show(); navigate(-1, key.key); } });
  scope.listen(trigger, 'click', () => { if (disclosure.open) navigate(-1, 'ArrowDown'); });
  scope.listen(panel, 'keydown', event => {
    const key = event as KeyboardEvent; if (key.altKey || key.ctrlKey || key.metaKey || key.isComposing) return;
    const current = items.indexOf(eventElement(event)?.closest<HTMLElement>('[role="menuitem"]') as HTMLElement);
    if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(key.key)) { event.preventDefault(); navigate(current, key.key); }
    else if ((key.key === 'Enter' || key.key === ' ') && current >= 0 && !isDisabled(items[current]!)) { event.preventDefault(); items[current]!.click(); }
    else if (key.key === 'Tab') disclosure.close();
    else if (key.key.length === 1 && key.key !== ' ') {
      query += normalizeSearch(key.key); if (timer !== undefined) clearTimeout(timer); timer = setTimeout(() => { query = ''; }, 500);
      for (let offset = 1; offset <= items.length; offset++) { const index = (current + offset + items.length) % items.length; if (!isDisabled(items[index]!) && normalizeSearch(items[index]!.textContent || '').startsWith(query)) { event.preventDefault(); focus(index); break; } }
    }
  });
  scope.listen(panel, 'click', event => { const item = eventElement(event)?.closest<HTMLElement>('[role="menuitem"]'); if (!item || !items.includes(item)) return; if (isDisabled(item)) { event.preventDefault(); return; } const value = item.dataset.nqValue ?? item.textContent?.trim() ?? ''; disclosure.close(true); emit(root, { value }); options.onSelect?.(value); });
  return { get open() { return disclosure.open; }, show() { disclosure.show(); navigate(-1, 'ArrowDown'); }, close: disclosure.close, destroy() { disclosure.destroy(); scope.destroy(); } };
}

export function createDrawer(dialog: HTMLDialogElement, options: DialogOptions = {}): DialogController { return createDialog(dialog, options); }

export interface ToastRegionOptions { onDismiss?: (id: string) => void }
export function createToastRegion(root: HTMLElement, options: ToastRegionOptions = {}): { dismiss(target: string | HTMLElement): void; destroy(): void } {
  const scope = createCleanup(); remember(scope, root, ['role', 'aria-live', 'tabindex']);
  if (!root.hasAttribute('role')) root.setAttribute('role', 'status'); if (!root.hasAttribute('aria-live')) root.setAttribute('aria-live', root.getAttribute('role') === 'alert' ? 'assertive' : 'polite');
  const remembered = new WeakSet<HTMLElement>();
  const dismiss = (target: string | HTMLElement) => {
    if (scope.destroyed) return; const toast = typeof target === 'string' ? [...root.querySelectorAll<HTMLElement>('[data-nq-toast]')].find(node => node.id === target) : target;
    if (!toast || !root.contains(toast) || toast.hidden) return;
    if (!remembered.has(toast)) { remember(scope, toast, ['hidden']); remembered.add(toast); }
    const hadFocus = toast.contains(root.ownerDocument.activeElement); toast.hidden = true;
    if (hadFocus) { const next = [...root.querySelectorAll<HTMLElement>('[data-nq-dismiss]')].find(button => !button.closest('[hidden]')); if (next) next.focus(); else { root.tabIndex = -1; root.focus(); } }
    emit(root, { dismissed: toast.id }); options.onDismiss?.(toast.id);
  };
  scope.listen(root, 'click', event => { const button = eventElement(event)?.closest<HTMLElement>('[data-nq-dismiss]'); if (!button || isDisabled(button)) return; const toast = button.closest<HTMLElement>('[data-nq-toast]'); if (toast) { event.preventDefault(); dismiss(toast); } });
  return { dismiss, destroy: () => scope.destroy() };
}
