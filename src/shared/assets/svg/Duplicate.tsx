import { SVGProps } from 'react';

export function DuplicateSVG(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      width='24'
      height='24'
      viewBox='0 0 24 24'
      fill='none'
      xmlns='http://www.w3.org/2000/svg'
      data-icon='duplicate'
      {...props}
    >
      <path
        d='M7.61719 11.9766L4 14.6218L12 20L20 14.6218L16.4023 11.9727M4 9.5L12 4L20 9.5L12 15L4 9.5Z'
        stroke='currentColor'
        strokeWidth='1.5'
      />
    </svg>
  );
}
