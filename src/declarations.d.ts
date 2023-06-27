// add declarations.d.ts file to your project

declare module NodeModule {
    interface __HotModuleReplacement {
      accept(dependencies: string[], callback: (updatedDependencies: any) => void): void;
      accept(dependency: string, callback: () => void): void;
      accept(errHandler?: (err: Error) => void): void;
    }
  
    interface NodeModule {
      hot?: __HotModuleReplacement;
    }
  }
  