import { SVGProps } from 'react';

export function PlayArrowSVG(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      height='20px'
      viewBox='0 -960 960 960'
      width='20px'
      fill='currentColor'
      {...props}
    >
      <path d='M320-200v-560l440 280-440 280Zm80-280Zm0 134 210-134-210-134v268Z' />
    </svg>
  );
}
