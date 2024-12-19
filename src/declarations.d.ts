declare namespace NodeModule {
  type __HotModuleReplacement = {
    accept(dependencies: string[], callback: (updatedDependencies: unknown) => void): void;
    accept(dependency: string, callback: () => void): void;
    accept(errHandler?: (err: Error) => void): void;
  };

  type NodeModule = {
    hot?: __HotModuleReplacement;
  };
}

declare module '*.symbol.svg' {
  const content: string;
  export default content;
}

declare module '*.svg' {
  const content: React.FunctionComponent<React.SVGAttributes<SVGElement>>;
  export default content;
}

declare module '*.module.css' {
  const classes: { [key: string]: string };
  export default classes;
}
