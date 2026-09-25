import { CounterProps } from '@cloud-ru/ds-counter';

export function getCounterProps(count: number): { appearance: CounterProps['appearance']; label: number } | undefined {
  if (count <= 0) {
    return;
  }

  return {
    appearance: 'primary',
    label: count,
  };
}
