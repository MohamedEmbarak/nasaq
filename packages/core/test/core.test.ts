import { describe, expect, it, vi } from 'vitest';
import {
  createCleanup, createComboboxState, filterOptions, formatDate, formatNumber,
  getComboboxOptions, getNextEnabledIndex, normalizeSearch, transitionCombobox,
} from '../src/index.js';

const cities = [
  { value: 'riyadh', label: 'الرِّيَاض' },
  { value: 'jeddah', label: 'جدة', disabled: true },
  { value: 'abha', label: 'أبها' },
];

describe('search and navigation', () => {
  it('normalizes Arabic presentation, marks, tatweel and alef without changing labels', () => {
    expect(normalizeSearch('  إِسْـلام   أَبْهَا ')).toBe('اسلام ابها');
    expect(filterOptions(cities, 'ابها')).toEqual([cities[2]]);
    expect(filterOptions(cities, 'الرياض')[0]).toBe(cities[0]);
    expect(filterOptions(cities, '')).toHaveLength(3);
  });

  it('wraps visual RTL navigation and skips disabled items', () => {
    expect(getNextEnabledIndex(0, 'ArrowRight', cities)).toBe(2);
    expect(getNextEnabledIndex(0, 'ArrowLeft', cities, 'rtl')).toBe(2);
    expect(getNextEnabledIndex(0, 'ArrowRight', cities, 'rtl')).toBe(2);
    expect(getNextEnabledIndex(2, 'ArrowDown', cities, 'rtl', 'vertical')).toBe(0);
    expect(getNextEnabledIndex(-1, 'ArrowUp', cities, 'rtl', 'vertical')).toBe(2);
    expect(getNextEnabledIndex(2, 'Home', cities)).toBe(0);
    expect(getNextEnabledIndex(0, 'End', cities)).toBe(2);
    expect(getNextEnabledIndex(0, 'ArrowDown', cities)).toBe(0);
    expect(getNextEnabledIndex(0, 'ArrowRight', [{ disabled: true }])).toBe(-1);
    expect(getNextEnabledIndex(0, 'End', [])).toBe(-1);
  });

  it('keeps locale, calendar, time zone and numeral choices explicit', () => {
    expect(formatNumber(1234.5, { locale: 'en-US', numberingSystem: 'latn' })).toBe('1,234.5');
    expect(formatDate('2026-01-01T22:00:00Z', { locale: 'en-GB', calendar: 'gregory', timeZone: 'Asia/Riyadh' })).toBe('02/01/2026');
    const options = { locale: 'ar-SA', calendar: 'islamic-umalqura', timeZone: 'UTC', numberingSystem: 'latn' };
    const date = new Date('2026-01-01T00:00:00Z');
    const { locale, ...format } = options;
    expect(formatDate(date, options)).toBe(new Intl.DateTimeFormat(locale, format).format(date));
  });
});

describe('combobox transitions shared by all adapters', () => {
  it('keeps active and committed values distinct and skips disabled items', () => {
    let state = createComboboxState(cities);
    state = transitionCombobox(state, { type: 'navigate', key: 'ArrowDown' }, cities);
    expect(state).toEqual({ value: '', query: '', open: true, activeIndex: 0 });
    state = transitionCombobox(state, { type: 'navigate', key: 'ArrowDown' }, cities);
    expect(state.activeIndex).toBe(2);
    expect(state.value).toBe('');
    expect(transitionCombobox(state, { type: 'select', value: 'jeddah' }, cities)).toBe(state);
    state = transitionCombobox(state, { type: 'select', value: 'abha' }, cities);
    expect(state).toEqual({ value: 'abha', query: 'أبها', open: false, activeIndex: -1 });
    expect(getComboboxOptions(state, cities)).toEqual(cities);
  });

  it('filters edited queries; Escape/outside close never silently commits', () => {
    let state = createComboboxState(cities, 'riyadh');
    state = transitionCombobox(state, { type: 'input', query: 'ابه' }, cities);
    expect(state.value).toBe('');
    expect(getComboboxOptions(state, cities)).toEqual([cities[2]]);
    state = transitionCombobox(state, { type: 'navigate', key: 'End' }, cities);
    expect(state.activeIndex).toBe(0);
    state = transitionCombobox(state, { type: 'close' }, cities);
    expect(state).toEqual({ value: '', query: 'ابه', open: false, activeIndex: -1 });
    expect(transitionCombobox(state, { type: 'reset', value: 'riyadh' }, cities)).toEqual(createComboboxState(cities, 'riyadh'));
  });

  it('handles no results and invalid or disabled initial values', () => {
    const empty = transitionCombobox(createComboboxState(cities), { type: 'input', query: 'missing' }, cities);
    expect(transitionCombobox(empty, { type: 'navigate', key: 'ArrowDown' }, cities).activeIndex).toBe(-1);
    expect(createComboboxState(cities, 'jeddah').value).toBe('');
    expect(createComboboxState(cities, 'missing').value).toBe('');
  });
});

describe('lifecycle', () => {
  it('cleans each callback and listener once, including additions after teardown', () => {
    const scope = createCleanup();
    const target = new EventTarget();
    const listener = vi.fn();
    const cleanup = vi.fn();
    scope.listen(target, 'change', listener);
    scope.add(cleanup);
    target.dispatchEvent(new Event('change'));
    scope.destroy(); scope.destroy();
    target.dispatchEvent(new Event('change'));
    expect(listener).toHaveBeenCalledTimes(1);
    expect(cleanup).toHaveBeenCalledTimes(1);
    const late = vi.fn();
    scope.add(late);
    expect(late).toHaveBeenCalledTimes(1);
  });

  it('still releases remaining resources if one cleanup throws', () => {
    const scope = createCleanup();
    const remaining = vi.fn();
    scope.add(remaining);
    scope.add(() => { throw new Error('cleanup failure'); });
    expect(() => scope.destroy()).toThrow('cleanup failure');
    expect(remaining).toHaveBeenCalledTimes(1);
    expect(() => scope.destroy()).not.toThrow();
  });
});
