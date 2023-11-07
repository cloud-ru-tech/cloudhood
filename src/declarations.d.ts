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

declare module '*.svg' {
  const content: React.FunctionComponent<React.SVGAttributes<SVGElement>>;
  export default content;
}
