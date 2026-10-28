import { computed, inject, onBeforeUnmount, onMounted, provide, ref, useId } from 'vue';
import type { ComputedRef, InjectionKey, Ref, VNodeChild } from 'vue';

export interface FieldDecoration { label?: string; hint?: string; error?: string; required?: boolean }
export const decorationProps = { label: String, hint: String, error: String, required: { type: Boolean, default: undefined } } as const;
interface FieldContext { id: string; labelId?: string; describedby?: string; invalid?: boolean; required?: boolean }
const fieldKey: InjectionKey<ComputedRef<FieldContext>> = Symbol('nasaq-field');
export function provideField(value: ComputedRef<FieldContext>) { provide(fieldKey, value); }
export function joinIds(...values: unknown[]): string | undefined { return values.filter(Boolean).join(' ') || undefined; }
export function useField(props: FieldDecoration, attrs: Record<string, unknown>) {
  const generated = `nq-${useId()}`;
  const parent = inject(fieldKey, undefined);
  const decorated = computed(() => Boolean(props.label || props.hint || props.error));
  const id = computed(() => String(attrs.id ?? parent?.value.id ?? generated));
  const labelId = computed(() => props.label ? `${id.value}-label` : parent?.value.labelId);
  const describedby = computed(() => joinIds(attrs['aria-describedby'], parent?.value.describedby,
    props.hint && `${id.value}-hint`, props.error && `${id.value}-error`));
  const controlAttrs = computed(() => ({ id: id.value, 'aria-labelledby': joinIds(attrs['aria-labelledby'], labelId.value),
    'aria-describedby': describedby.value, 'aria-invalid': props.error || parent?.value.invalid ? true : attrs['aria-invalid'],
    required: props.required ?? parent?.value.required }));
  return { id, decorated, controlAttrs };
}
export function useValue<T>(read: () => T | undefined, initial: T, emit: (value: T) => void) {
  const local = ref(initial) as Ref<T>;
  const value = computed(() => read() === undefined ? local.value : read() as T);
  const set = (next: T) => { local.value = next; emit(next); };
  return { value, set };
}
export function useFormReset(element: Ref<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | undefined>, reset: () => void) {
  let form: HTMLFormElement | null | undefined;
  const listener = (event: Event) => queueMicrotask(() => { if (!event.defaultPrevented) reset(); });
  onMounted(() => { form = element.value?.form; form?.addEventListener('reset', listener); });
  onBeforeUnmount(() => form?.removeEventListener('reset', listener));
}
export type RenderContent = VNodeChild;
