# Example Deephaven Enterprise React Application

This project was bootstrapped with [Vite using the react-ts template](https://vitejs.dev/guide/). It is to provide an example React application connecting to Deephaven and displaying a table of data within a dashboard.

## Quick Start

You need to set the ENV variables defined in [.env](./.env). After those are set, simply run:

```
npm install
npm start
```

Your development server will start up. You can then open up the URL in your browser and you should see a dashboard loaded with data.

The layouts defined in [./src/json/LayoutConfig.json](./src/json/LayoutConfig.json) specify which panels from which queries are loaded, and should be modified to match your setup.

# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type aware lint rules:

- Configure the top-level `parserOptions` property like this:

```js
   parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    project: ['./tsconfig.json', './tsconfig.node.json'],
    tsconfigRootDir: __dirname,
   },
```

- Replace `plugin:@typescript-eslint/recommended` to `plugin:@typescript-eslint/recommended-type-checked` or `plugin:@typescript-eslint/strict-type-checked`
- Optionally add `plugin:@typescript-eslint/stylistic-type-checked`
- Install [eslint-plugin-react](https://github.com/jsx-eslint/eslint-plugin-react) and add `plugin:react/recommended` & `plugin:react/jsx-runtime` to the `extends` list
