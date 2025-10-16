import { CounterProps } from '@snack-uikit/counter';

export function getCounterProps(count: number): { appearance: CounterProps['appearance'], label: number  } | undefined {
  if (count <= 0) {
    return;
  }

  return {
    appearance: 'primary',
    label: count,
  }
}