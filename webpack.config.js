const path = require("path");
const webpack = require("webpack");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");

const isDevelopment = process.env.NODE_ENV !== "production";
const dotenv = require("dotenv");
dotenv.config();

module.exports = {
  mode: isDevelopment ? "development" : "production",
  // Production 빌드 시, 리액트 코드 트랜스파일링 할 시작점 설정.
  entry: "./src/index.tsx",

  devServer: {
    static: {
      directory: path.resolve(__dirname, "public"),
    },
    client: {
      overlay: {
        runtimeErrors: (error) => {
          if (error.message == "ResizeObserver loop limit exceeded") {
            return false;
          }
          return true;
        },
      },
    },
    hot: true,
    historyApiFallback: true,
    compress: true,
    port: 3000,
  },

  // swc 연동을 위한 swc-loader 장착.
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        loader: "ts-loader",
        exclude: /node_modules/,
        options: {
          allowTsInNodeModules: true,
          compilerOptions: { noEmit: false },
        },
      },
      {
        test: /\.js?/,
        loader: "babel-loader",
        options: {
          presets: ["@babel/preset-env", "@babel/preset-react"],
          plugins: ["@babel/plugin-proposal-class-properties"],
        },
      },
      {
        test: /\.jsx?$/,
        loader: "babel-loader",
        options: {
          presets: ["@babel/preset-env", "@babel/preset-react"],
          plugins: ["@babel/plugin-proposal-class-properties"],
        },
      },
      {
        test: /\.json$/,
        loader: "json-loader",
        type: "javascript/auto",
      },
      {
        test: /\.scss$/i,
        use: [
          // Creates `style` nodes from JS strings
          "style-loader",
          // Translates CSS into CommonJS
          "css-loader",
          // PostCSS
          {
            loader: "postcss-loader",
            options: {
              precision: 10,
              plugins: [require("autoprefixer")(), require("postcss-calc")()],
            },
          },
          // Compiles Sass to CSS
          {
            loader: "sass-loader",
            options: {
              implementation: require("node-sass"),
              // implementation: require('dart-sass'),
              sassOptions: {
                outputStyle: "compressed",
                precision: 10,
                // fiber: require('fibers')
              },
            },
          },
        ],
      },
      {
        test: /\.css$/i,
        use: ["style-loader", "css-loader"],
      },
      {
        test: /\.(png|jpg|jpeg|ttf|woff|svg)$/,
        use: [
          {
            loader: "file-loader",
            options: {
              outputPath: "static/media",
            },
          },
        ],
      },
    ],
  },

  // 번들링된 JS 코드를 html 파일과 매핑 및 주입시키기 위한 플러그인 설정.
  plugins: [
    new HtmlWebpackPlugin({
      template: "./public/index.html",
    }),
    new CopyWebpackPlugin({
      patterns: [
        {
          from: "public/",
          globOptions: {
            ignore: ["**/index.html"],
          },
        },
      ],
    }),
    new webpack.ProvidePlugin({
      process: 'process/browser',
    }),
    new webpack.EnvironmentPlugin([
      "REACT_APP_API_URL",
      "REACT_APP_API_KEY",
      "REACT_APP_AUTH_DOMAIN",
      "REACT_APP_PROJECT_ID",
      "REACT_APP_STORAGE_BUCKET",
      "REACT_APP_MESSAGING_SENDER_ID",
      "REACT_APP_APP_ID",
      "REACT_APP_MEASUREMENT_ID",
      "REACT_APP_VAPID_KEY",
    ]),
    new webpack.ProvidePlugin({ React: "react" }),
  ],
  resolve: {
    extensions: [".tsx", ".ts", ".js", ".jsx", ".scss", ".css"],
  },
  output: {
    path: path.resolve(__dirname, "build"),
    filename: "[name].[contenthash:8].js",
    clean: true,
  },
};
