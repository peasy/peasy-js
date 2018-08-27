module.exports = {
   // entry is the "main" source file we want to include/import
   entry: "./src/index.js",
   // output tells webpack where to put the bundle it creates
   output: {
      // in the case of a "plain global browser library", this
      // will be used as the reference to our module that is
      // hung off of the window object.
      library: "peasy",
      // We want webpack to build a UMD wrapper for our module
      libraryTarget: "umd",
      // the destination file name
      filename: "peasy.js",
      globalObject: "this"
   },
   module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader"
        }
      }
    ]
  }
};
