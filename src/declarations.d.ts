// add declarations.d.ts file to your project

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
