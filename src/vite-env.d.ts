/// <reference types="vite/client" />

declare module '*.svg?react' {
  import { ComponentType, SVGProps } from 'react';
  const content: ComponentType<SVGProps<SVGElement>>;
  export default content;
}

declare module '*.svg' {
  const content: string;
  export default content;
}

interface ImportMetaEnv {
  readonly VITE_NODE_ENV: string;
  readonly VITE_BROWSER: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
