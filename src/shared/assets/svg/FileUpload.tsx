import { SVGProps } from 'react';

interface IconS24pxProps extends SVGProps<SVGSVGElement> {
  size?: number;
}

export function FileUploadSVG({ size = 24, ...props }: IconS24pxProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <mask
        id="mask0_2238_9694"
        style={{ maskType: 'alpha' }}
        maskUnits="userSpaceOnUse"
        x="0"
        y="0"
        width="24"
        height="24"
      >
        <path
          d="M15.5 12.5L12 9M12 9L8.5 12.5M12 9V16M18 19H6V5H14.5714L18 8.5L18 19Z"
          stroke="black"
          strokeWidth="1.5"
        />
      </mask>
      <g mask="url(#mask0_2238_9694)">
        <rect width="24" height="24" fill="#787B8A" />
      </g>
    </svg>
  );
}
