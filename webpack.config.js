const path = require("path");

module.exports = {
  mode: "development",
  devtool: "inline-source-map",
  entry: "./src/lib.ts",
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "wi-web.js",
    libraryTarget: "commonjs2",
  },
  externals: ["express"],
  target: "node",
  resolve: {
    // Add `.ts` and `.tsx` as a resolvable extension.
    extensions: [".ts", ".tsx", ".js"],
  },
  module: {
    rules: [
      // all files with a `.ts` or `.tsx` extension will be handled by `ts-loader`
      {
        test: /\.tsx?$/,
        loader: "ts-loader",
      },
    ],
  },
};
