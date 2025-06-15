var webpack = require('webpack'),
  path = require('path'),
  fileSystem = require('fs-extra'),
  env = require('./scripts/env'),
  CopyWebpackPlugin = require('copy-webpack-plugin'),
  HtmlWebpackPlugin = require('html-webpack-plugin'),
  TerserPlugin = require('terser-webpack-plugin');
var { CleanWebpackPlugin } = require('clean-webpack-plugin');
var MiniCssExtractPlugin = require('mini-css-extract-plugin');
var fs = require('fs');
var { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');

var pathResolve = (...args) => path.resolve(process.cwd(), ...args);
var replaceGlobs = path => path.replace(/(\/\*\*)*\/\*$/, '');

function tsconfigPathsConverter(tsConfigPath, dirname = '.') {
  var tsConfig = JSON.parse(fileSystem.readFileSync(tsConfigPath).toString());
  var { baseUrl, paths = {} } = tsConfig.compilerOptions;
  return Object.keys(paths).reduce((aliases, pathName) => {
    var alias = replaceGlobs(pathName);
    var path = replaceGlobs(paths[pathName][0]);
    aliases[alias] = pathResolve(dirname, baseUrl, path);
    return aliases;
  }, {});
}

var ASSET_PATH = process.env.ASSET_PATH || '/';
var TARGET_BROWSER = process.env.BROWSER || 'chrome';
var BUILD_DIR = process.env.BUILD_DIR || '';

// load the secrets
var secretsPath = path.join(__dirname, 'secrets.' + env.NODE_ENV + '.js');

var fileExtensions = ['jpg', 'jpeg', 'png', 'gif', 'eot', 'otf', 'ttf', 'woff', 'woff2'];

if (fileSystem.existsSync(secretsPath)) {
  alias['secrets'] = secretsPath;
}

var options = {
  mode: process.env.NODE_ENV || 'development',
  entry: {
    popup: path.join(__dirname, 'src', 'index.tsx'),
    background: path.join(__dirname, 'src', 'background.ts'),
  },
  output: {
    filename: '[name].bundle.js',
    path: BUILD_DIR ? path.resolve(__dirname, 'build', BUILD_DIR) : path.resolve(__dirname, 'build'),
    clean: true,
    publicPath: ASSET_PATH,
  },
  module: {
    rules: [
      {
        test: /\.(css)$/,
        use: [
          {
            loader: MiniCssExtractPlugin.loader,
          },
          {
            loader: 'css-loader',
            options: {
              importLoaders: 1,
              modules: { auto: true },
            },
          },
        ],
      },
      {
        test: /\.symbol.svg$/,
        use: 'svg-inline-loader',
      },
      {
        test: /\.svg$/i,
        issuer: /\.[jt]sx?$/,
        exclude: /\.symbol.svg$/,
        use: ['@svgr/webpack'],
      },
      {
        test: new RegExp('.(' + fileExtensions.join('|') + ')$'),
        type: 'asset/resource',
        exclude: /node_modules/,
      },
      {
        test: /\.html$/,
        loader: 'html-loader',
        exclude: /node_modules/,
      },
      { test: /\.(ts|tsx)$/, loader: 'ts-loader', exclude: /node_modules/ },
    ],
  },
  resolve: {
    alias: tsconfigPathsConverter(pathResolve('tsconfig.json')),
    extensions: fileExtensions.map(extension => '.' + extension).concat(['.js', '.jsx', '.ts', '.tsx', '.css']),
  },
  plugins: [
    new BundleAnalyzerPlugin({
      analyzerMode: 'disabled',
    }),
    new CleanWebpackPlugin({ verbose: false }),
    new webpack.ProgressPlugin({
      handler: (percentage, message, ...args) => {
        console.info(`${Math.round(percentage * 100)}%`, message, ...args);
      },
    }),
    {
      apply: compiler => {
        compiler.hooks.beforeRun.tap('EnsureBuildDirExists', () => {
          if (BUILD_DIR) {
            const buildDir = path.resolve(__dirname, 'build', BUILD_DIR);
            if (!fs.existsSync(path.resolve(__dirname, 'build'))) {
              fs.mkdirSync(path.resolve(__dirname, 'build'));
            }
            if (!fs.existsSync(buildDir)) {
              fs.mkdirSync(buildDir);
            }
          }
        });
      },
    },
    new webpack.EnvironmentPlugin(['NODE_ENV', 'BROWSER']),
    new MiniCssExtractPlugin({ filename: 'styles.css' }),
    new CopyWebpackPlugin({
      patterns: [
        {
          from: TARGET_BROWSER === 'firefox' ? 'manifest.firefox.json' : 'manifest.chromium.json',
          to: BUILD_DIR
            ? path.join(__dirname, 'build', BUILD_DIR, 'manifest.json')
            : path.join(__dirname, 'build', 'manifest.json'),
          force: true,
          transform: function (content) {
            const manifest = {
              description: process.env.npm_package_description,
              version: process.env.npm_package_version,
              ...JSON.parse(content.toString()),
            };

            // Добавляем ID расширения для Firefox из переменной окружения
            if (TARGET_BROWSER === 'firefox' && process.env.FIREFOX_EXTENSION_ID) {
              manifest.browser_specific_settings = {
                gecko: {
                  id: process.env.FIREFOX_EXTENSION_ID,
                },
              };
            }

            return Buffer.from(JSON.stringify(manifest, null, 2));
          },
        },
      ],
    }),
    new CopyWebpackPlugin({
      patterns: [
        {
          from: 'src/assets/img',
          to: BUILD_DIR ? path.join(__dirname, 'build', BUILD_DIR) : path.join(__dirname, 'build'),
          force: true,
        },
      ],
    }),
    new HtmlWebpackPlugin({
      template: path.join(__dirname, 'src', 'index.html'),
      filename: 'popup.html',
      chunks: ['popup'],
      cache: false,
    }),
  ],
  infrastructureLogging: {
    level: 'info',
  },
};

if (env.NODE_ENV === 'development') {
  options.devtool = 'cheap-module-source-map';
} else {
  options.optimization = {
    minimize: true,
    minimizer: [
      new TerserPlugin({
        extractComments: false,
      }),
    ],
  };
}

module.exports = options;
