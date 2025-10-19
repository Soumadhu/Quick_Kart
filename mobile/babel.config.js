module.exports = function(api) {
  api.cache(true);
  return {
    presets: [
      'babel-preset-expo',
      '@babel/preset-flow',
    ],
    plugins: [
      // Add any additional plugins here
    ],
  };
};
