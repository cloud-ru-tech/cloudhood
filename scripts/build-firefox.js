/* eslint-disable @typescript-eslint/no-var-requires */
// Do this as the first thing so that any code reading it knows the right env.
process.env.BABEL_ENV = 'production';
process.env.NODE_ENV = 'production';
process.env.ASSET_PATH = '/';
process.env.BROWSER = 'firefox';
process.env.BUILD_DIR = 'firefox';

var webpack = require('webpack'),
  config = require('../webpack.config');

delete config.chromeExtensionBoilerplate;

config.mode = 'production';

webpack(config, function (err, stats) {
  if (err) {
    console.error(err);
    process.exit(1);
  }

  // eslint-disable-next-line no-console
  console.log(
    stats.toString({
      colors: true,
      modules: false,
      children: false,
      chunks: false,
      chunkModules: false,
    }),
  );

  // eslint-disable-next-line no-console
  console.log('\nBuild completed in', stats.endTime - stats.startTime, 'ms');
});
