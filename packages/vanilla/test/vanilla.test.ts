// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createCombobox, createDialog, createPagination, createTabs, createTooltip, enhance } from '../src/index.js';

afterEach(() => { document.body.innerHTML = ''; vi.useRealTimers(); });

function mount(html: string): HTMLElement {
  document.body.innerHTML = html;
  return document.body.firstElementChild as HTMLElement;
}

function key(element: HTMLElement, value: string, extra: KeyboardEventInit = {}): KeyboardEvent {
  const event = new KeyboardEvent('keydown', { key: value, bubbles: true, cancelable: true, ...extra });
  element.dispatchEvent(event);
  return event;
}

const tabMarkup = `<div data-nq="tabs" dir="rtl">
  <div role="tablist" aria-label="Details">
    <button role="tab" aria-controls="one" data-nq-value="one">One</button>
    <button role="tab" aria-controls="two" data-nq-value="two" disabled>Two</button>
    <button role="tab" aria-controls="three" data-nq-value="three">Three</button>
    <button role="tab" aria-controls="four" data-nq-value="four">Four</button>
  </div>
  <div id="one">First</div><div id="two">Second</div><div id="three">Third</div><div id="four">Fourth</div>
</div>`;

const comboMarkup = `<div data-nq="combobox"><label for="city">City</label>
  <input id="city" data-nq-combobox-input><input type="hidden" name="city" data-nq-combobox-value>
  <ul data-nq-combobox-list hidden>
    <li data-nq-value="riyadh">الرياض</li><li data-nq-value="jeddah" aria-disabled="true">جدة</li><li data-nq-value="abha">أبها</li>
  </ul></div>`;

describe('tabs', () => {
  it('moves visually in RTL, skips disabled tabs, and restores authored DOM', () => {
    const root = mount(tabMarkup);
    const before = root.outerHTML;
    const controller = createTabs(root);
    const tabs = [...root.querySelectorAll<HTMLElement>('[role="tab"]')];
    tabs[0]!.focus();
    key(tabs[0]!, 'ArrowLeft');
    expect(controller.value).toBe('three');
    expect(document.activeElement).toBe(tabs[2]);
    key(tabs[2]!, 'ArrowRight');
    expect(controller.value).toBe('one');
    key(tabs[0]!, 'End');
    expect(controller.value).toBe('four');
    expect(key(tabs[3]!, 'ArrowDown').defaultPrevented).toBe(false);
    controller.destroy(); controller.destroy();
    expect(root.outerHTML).toBe(before);
  });

  it('supports manual activation without changing selection on focus movement', () => {
    const root = mount(tabMarkup);
    const controller = createTabs(root, { activationMode: 'manual' });
    const tabs = [...root.querySelectorAll<HTMLElement>('[role="tab"]')];
    key(tabs[0]!, 'End');
    expect(controller.value).toBe('one');
    expect(tabs[3]!.tabIndex).toBe(0);
    key(tabs[3]!, ' ');
    expect(controller.value).toBe('four');
    controller.destroy();
  });

  it('does not submit a containing form when an authored tab button has no type', () => {
    const form = mount(`<form>${tabMarkup}</form>`);
    const submitted = vi.fn((event: Event) => event.preventDefault());
    form.addEventListener('submit', submitted);
    const controller = createTabs(form.firstElementChild as HTMLElement);
    form.querySelector<HTMLButtonElement>('[data-nq-value="three"]')!.click();
    expect(controller.value).toBe('three');
    expect(submitted).not.toHaveBeenCalled();
    controller.destroy();
  });
});

describe('combobox', () => {
  it('filters Arabic, skips disabled items, commits explicitly, and emits one change', () => {
    const root = mount(comboMarkup);
    const before = root.outerHTML;
    const changed = vi.fn();
    root.addEventListener('nq:change', changed);
    const controller = createCombobox(root);
    const input = root.querySelector<HTMLInputElement>('[data-nq-combobox-input]')!;
    input.focus();
    key(input, 'ArrowDown'); key(input, 'ArrowDown');
    expect(input.getAttribute('aria-activedescendant')).toBe(root.querySelector('[data-nq-value="abha"]')!.id);
    expect(controller.value).toBe('');
    key(input, 'Enter');
    expect(controller.value).toBe('abha');
    expect(input.value).toBe('أبها');
    expect(root.querySelector<HTMLInputElement>('[name="city"]')!.value).toBe('abha');
    expect(changed).toHaveBeenCalledTimes(1);
    controller.show();
    expect([...root.querySelectorAll<HTMLElement>('[role="option"]')].every(node => !node.hidden)).toBe(true);
    input.value = 'الريا'; input.dispatchEvent(new Event('input', { bubbles: true }));
    expect(controller.value).toBe('');
    expect(root.querySelector<HTMLElement>('[data-nq-value="abha"]')!.hidden).toBe(true);
    key(input, 'ArrowDown'); key(input, 'Escape');
    expect(controller.open).toBe(false);
    expect(controller.value).toBe('');
    expect(input.value).toBe('الريا');
    expect(document.activeElement).toBe(input);
    controller.destroy();
    expect(root.outerHTML).toBe(before);
  });

  it('leaves text editing and IME alone, closes on blur/outside and resets forms', async () => {
    const form = mount(`<form>${comboMarkup}<button type="button">Outside</button></form>`);
    const root = form.firstElementChild as HTMLElement;
    const controller = createCombobox(root, { value: 'riyadh' });
    const input = root.querySelector<HTMLInputElement>('[data-nq-combobox-input]')!;
    expect(key(input, 'Home').defaultPrevented).toBe(false);
    expect(key(input, 'ArrowDown', { isComposing: true }).defaultPrevented).toBe(false);
    input.dispatchEvent(new Event('compositionstart'));
    input.value = 'ابه'; input.dispatchEvent(new Event('input', { bubbles: true }));
    expect(controller.value).toBe('riyadh');
    input.dispatchEvent(new Event('compositionend'));
    expect(controller.value).toBe('');
    form.lastElementChild!.dispatchEvent(new Event('pointerdown', { bubbles: true }));
    expect(controller.open).toBe(false);
    controller.show();
    input.dispatchEvent(new FocusEvent('focusout', { bubbles: true, relatedTarget: form.lastElementChild }));
    expect(controller.open).toBe(false);
    controller.select('abha');
    (form as HTMLFormElement).reset();
    await Promise.resolve();
    expect(controller.value).toBe('riyadh');
    controller.destroy();
  });

  it('does not intercept Enter when no option is active or open a disabled input', () => {
    const root = mount(comboMarkup);
    const controller = createCombobox(root);
    const input = root.querySelector<HTMLInputElement>('input')!;
    controller.show();
    expect(key(input, 'Enter').defaultPrevented).toBe(false);
    expect(key(input, 'Tab').defaultPrevented).toBe(false);
    expect(controller.open).toBe(false);
    input.disabled = true;
    controller.show();
    expect(controller.open).toBe(false);
    controller.destroy();
  });

  it('requires a committed option, reacts to required changes, and restores custom validity', async () => {
    const root = mount(comboMarkup);
    const input = root.querySelector<HTMLInputElement>('input')!;
    const controller = createCombobox(root, { invalidSelectionMessage: 'Choose an option.' });
    input.value = 'Unmatched city';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    expect(input.checkValidity()).toBe(true);
    input.required = true;
    await Promise.resolve();
    expect(input.checkValidity()).toBe(false);
    expect(input.validationMessage).toBe('Choose an option.');
    controller.select('riyadh');
    expect(input.checkValidity()).toBe(true);
    controller.destroy();
    expect(input.validity.customError).toBe(false);

    input.setCustomValidity('Application validation');
    const another = createCombobox(root, { value: 'riyadh' });
    expect(input.validationMessage).toBe('Application validation');
    another.destroy();
    expect(input.validationMessage).toBe('Application validation');
  });

  it('excludes a disabled combobox from native form submission and restores it on teardown', async () => {
    const form = mount(`<form>${comboMarkup}</form>`) as HTMLFormElement;
    const root = form.firstElementChild as HTMLElement;
    const controller = createCombobox(root, { value: 'riyadh' });
    const input = root.querySelector<HTMLInputElement>('[data-nq-combobox-input]')!;
    expect(new FormData(form).get('city')).toBe('riyadh');
    input.disabled = true;
    await Promise.resolve();
    expect(new FormData(form).has('city')).toBe(false);
    controller.destroy();
    expect(root.querySelector<HTMLInputElement>('[data-nq-combobox-value]')!.disabled).toBe(false);
  });
});

describe('enhancement ownership', () => {
  it('reference counts repeated and overlapping enhancement and reattaches after cleanup', () => {
    const root = mount(comboMarkup);
    const before = root.outerHTML;
    const first = enhance(root);
    const second = enhance(document);
    expect(root.querySelectorAll('[data-nq-combobox-status]')).toHaveLength(1);
    first(); first();
    const input = root.querySelector<HTMLInputElement>('input')!;
    key(input, 'ArrowDown');
    expect(input.getAttribute('aria-expanded')).toBe('true');
    second();
    expect(root.outerHTML).toBe(before);
    const third = enhance(root);
    third();
    expect(root.outerHTML).toBe(before);
  });

  it('rolls back previously enhanced roots when later markup is invalid', () => {
    const root = mount(`<main>${comboMarkup}<div data-nq="tabs"></div></main>`);
    const before = root.outerHTML;
    expect(() => enhance(root)).toThrow();
    expect(root.outerHTML).toBe(before);
  });
});

describe('native dialog lifecycle', () => {
  it('uses native modal methods and restores focus, including destroy while open', () => {
    mount(`<main><button data-nq-dialog-open="dialog">Open</button><dialog id="dialog"><button data-nq-dialog-close>Close</button></dialog></main>`);
    const trigger = document.querySelector<HTMLButtonElement>('button')!;
    const dialog = document.querySelector<HTMLDialogElement>('dialog')!;
    // jsdom has no modal focus algorithm; native browser coverage verifies that.
    dialog.showModal = vi.fn(() => { dialog.open = true; dialog.querySelector<HTMLButtonElement>('button')!.focus(); });
    dialog.close = vi.fn(() => { dialog.open = false; dialog.dispatchEvent(new Event('close')); });
    const controller = createDialog(dialog);
    trigger.focus(); trigger.click();
    expect(dialog.showModal).toHaveBeenCalledTimes(1);
    expect(controller.open).toBe(true);
    dialog.querySelector<HTMLButtonElement>('button')!.click();
    expect(controller.open).toBe(false);
    expect(document.activeElement).toBe(trigger);
    trigger.click(); controller.destroy(); controller.destroy();
    expect(dialog.close).toHaveBeenCalledTimes(2);
    expect(document.activeElement).toBe(trigger);
    trigger.click();
    expect(dialog.showModal).toHaveBeenCalledTimes(2);
  });
});

describe('tooltip and pagination', () => {
  it('keeps tooltip open across pointer movement and preserves existing descriptions', () => {
    vi.useFakeTimers();
    const root = mount(`<span><button data-nq-tooltip-trigger aria-describedby="help">Help</button><span role="tooltip" hidden>Details</span></span>`);
    const before = root.outerHTML;
    const controller = createTooltip(root);
    const trigger = root.querySelector('button')!;
    const tooltip = root.querySelector<HTMLElement>('[role="tooltip"]')!;
    trigger.dispatchEvent(new Event('pointerenter'));
    trigger.dispatchEvent(new Event('pointerleave'));
    tooltip.dispatchEvent(new Event('pointerenter'));
    vi.runAllTimers();
    expect(tooltip.hidden).toBe(false);
    expect(trigger.getAttribute('aria-describedby')).toContain('help ');
    key(trigger, 'Escape');
    expect(tooltip.hidden).toBe(true);
    controller.destroy();
    expect(root.outerHTML).toBe(before);
  });

  it('updates pagination boundaries and current page without trapping keyboard focus', () => {
    const root = mount(`<nav data-nq-total="3"><button data-nq-page="previous">Previous</button><button data-nq-page="1">1</button><button data-nq-page="2">2</button><button data-nq-page="3">3</button><button data-nq-page="next">Next</button></nav>`);
    const before = root.outerHTML;
    const controller = createPagination(root);
    expect(root.querySelector<HTMLButtonElement>('[data-nq-page="previous"]')!.disabled).toBe(true);
    root.querySelector<HTMLButtonElement>('[data-nq-page="3"]')!.click();
    expect(controller.page).toBe(3);
    expect(root.querySelector('[aria-current="page"]')!.textContent).toBe('3');
    expect(root.querySelector<HTMLButtonElement>('[data-nq-page="next"]')!.disabled).toBe(true);
    controller.select(4);
    expect(controller.page).toBe(3);
    controller.destroy();
    expect(root.outerHTML).toBe(before);
  });
});
