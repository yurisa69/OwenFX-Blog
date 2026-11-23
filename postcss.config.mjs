const config = {
  plugins: {
    '@tailwindcss/postcss': {},
    [process.cwd() + '/scripts/postcss-css-scope.cjs']: {},
  },
};

export default config;
