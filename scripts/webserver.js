/* eslint-disable @typescript-eslint/no-var-requires */
// Do this as the first thing so that any code reading it knows the right env.
process.env.BABEL_ENV = 'development';
process.env.NODE_ENV = 'development';
process.env.ASSET_PATH = '/';
// Default browser and build dir
process.env.BROWSER = process.env.BROWSER || 'chrome';
process.env.BUILD_DIR = process.env.BROWSER === 'firefox' ? 'firefox' : 'chrome';

var WebpackDevServer = require('webpack-dev-server'),
  webpack = require('webpack'),
  config = require('../webpack.config'),
  env = require('./env'),
  path = require('path');

var options = config.chromeExtensionBoilerplate || {};
var excludeEntriesToHotReload = options.notHotReload || [];

for (var entryName in config.entry) {
  if (excludeEntriesToHotReload.indexOf(entryName) === -1) {
    config.entry[entryName] = [
      'webpack/hot/dev-server',
      `webpack-dev-server/client?hot=true&hostname=localhost&port=${env.PORT}`,
    ].concat(config.entry[entryName]);
  }
}

config.plugins = [new webpack.HotModuleReplacementPlugin()].concat(config.plugins || []);

delete config.chromeExtensionBoilerplate;

var compiler = webpack(config);

var server = new WebpackDevServer(
  {
    server: {
      type: 'http',
    },
    hot: false,
    client: false,
    host: 'localhost',
    port: env.PORT,
    static: {
      directory: path.join(__dirname, `../build/${process.env.BUILD_DIR}`),
    },
    devMiddleware: {
      publicPath: `http://localhost:${env.PORT}/`,
      writeToDisk: true,
    },
    headers: {
      'Access-Control-Allow-Origin': '*',
    },
    allowedHosts: 'all',
  },
  compiler,
);

if (process.env.NODE_ENV === 'development' && module.hot) {
  module.hot.accept();
}

// eslint-disable-next-line no-console
console.log(
  `Starting ${process.env.BROWSER.toUpperCase()} extension development server (BUILD_DIR: ${
    process.env.BUILD_DIR
  }) on http://localhost:${env.PORT}`,
);

// Display startup info
// eslint-disable-next-line no-console
console.log(
  `Starting ${process.env.BROWSER.toUpperCase()} extension development server (BUILD_DIR: ${
    process.env.BUILD_DIR
  }) on http://localhost:${env.PORT}`,
);

(async () => {
  await server.start();
})();
