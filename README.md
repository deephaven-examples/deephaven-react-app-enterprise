# Example Deephaven Enterprise React Application

This project was bootstrapped with [Vite using the react-ts template](https://vitejs.dev/guide/). It is to provide an example React application connecting to Deephaven and displaying a table of data within a dashboard.

## Quick Start

You need to set the ENV variables defined in [.env](./.env). Change them in `.env`, or you can override them with a local `.env.local` file which is ignored by git. After those are set, simply run:

```
npm install
npm start
```

Your development server will start up. You can then open up the URL in your browser and you should see a table appear.

### Fetching a Table

At the default URL, it will create a table and display it using an `IrisGrid` component. To open this, simply navigate your browser to the development server URL, which is http://localhost:5173 by default.

You can also fetch a table from a PQ as well. To do this, navigate to http://localhost:5173/?queryName=MyQuery&tableName=myTable where `MyQuery` is the name of the query and `myTable` is the name of the table.

View the source for this width at [src/App.tsx](./src/App.tsx).

## IFrame Example

You can also display a widget from a Core+ worker in an IFrame. To do this, navigate to http://localhost:5173/iframe/?queryName=MyQuery&widgetName=myWidget where `MyQuery` is the name of the query and `myWidget` is the name of the widget.

View the source for this width at [src/IFrameApp.tsx](./src/IFrameApp.tsx).
