import colors from 'colors/safe';

enum Theme {
  Silly = 'rainbow',
  Input = 'grey',
  Verbose = 'cyan',
  Info = 'green',
  Data = 'white',
  Warn = 'yellow',
  Debug = 'blue',
  Error = 'red',
}

colors.setTheme({
  silly: Theme.Silly,
  input: Theme.Input,
  verbose: Theme.Verbose,
  info: Theme.Info,
  data: Theme.Data,
  warn: Theme.Warn,
  debug: Theme.Debug,
  error: Theme.Error,
});

const log = (message: string, theme: Theme = Theme.Warn): void => {
  const color = colors[theme];
  // eslint-disable-next-line no-console
  console.log(color(`${message}\n`));
};

export const logError = (message: string) => log(message, Theme.Error);
export const logInfo = (message: string) => log(message, Theme.Info);
export const logData = (message: string) => log(message, Theme.Data);
export const logWarn = (message: string) => log(message, Theme.Warn);
