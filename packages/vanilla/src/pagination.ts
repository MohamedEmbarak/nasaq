import { createCleanup, isDisabled } from '@nasaq/core';
import { emit, eventElement, remember } from './dom.js';

export interface PaginationOptions {
  page?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
}

export interface PaginationController {
  readonly page: number;
  select(page: number): void;
  destroy(): void;
}

export function createPagination(root: HTMLElement, options: PaginationOptions = {}): PaginationController {
  const nodes = [...root.querySelectorAll<HTMLElement>('[data-nq-page]')];
  const numeric = nodes.map(node => Number(node.dataset.nqPage)).filter(Number.isFinite);
  const totalPages = options.totalPages ?? Number(root.dataset.nqTotal ?? Math.max(1, ...numeric));
  if (!Number.isInteger(totalPages) || totalPages < 1) throw new Error('Nasaq: pagination totalPages must be a positive integer.');
  let page = options.page ?? Number(nodes.find(node => node.getAttribute('aria-current') === 'page')?.dataset.nqPage ?? 1);
  if (!Number.isInteger(page) || page < 1 || page > totalPages) page = 1;
  const scope = createCleanup();
  const initiallyDisabled = nodes.map(node => isDisabled(node));
  nodes.forEach(node => remember(scope, node, ['aria-current', 'aria-disabled', 'disabled']));
  const render = () => nodes.forEach((node, index) => {
    const target = node.dataset.nqPage;
    if (Number(target) === page) node.setAttribute('aria-current', 'page');
    else node.removeAttribute('aria-current');
    if (target === 'previous' || target === 'next') {
      const disabled = initiallyDisabled[index] || (target === 'previous' ? page === 1 : page === totalPages);
      node.setAttribute('aria-disabled', String(disabled));
      if (node.localName === 'button') node.toggleAttribute('disabled', disabled);
    }
  });
  const select = (nextPage: number) => {
    if (scope.destroyed || !Number.isInteger(nextPage) || nextPage < 1 || nextPage > totalPages || nextPage === page) return;
    page = nextPage;
    render();
    emit(root, { page }); options.onPageChange?.(page);
  };
  scope.listen(root, 'click', event => {
    const node = eventElement(event)?.closest<HTMLElement>('[data-nq-page]');
    if (!node || !nodes.includes(node)) return;
    if (isDisabled(node)) { event.preventDefault(); return; }
    // Real navigation links retain browser navigation and modifier-key behavior.
    if (node.localName === 'a' && node.hasAttribute('href')) return;
    event.preventDefault();
    const target = node.dataset.nqPage;
    select(target === 'previous' ? page - 1 : target === 'next' ? page + 1 : Number(target));
  });
  render();
  return { get page() { return page; }, select, destroy: () => scope.destroy() };
}
