import React from "react";
import ReactDOM from "react-dom";
import { RouterProvider, createBrowserRouter } from "react-router-dom";

// Need to import the base style sheet for proper styling
import "@deephaven/components/scss/BaseStyleSheet.scss";
import App from "./App";
import IFrameApp from "./IFrameApp";
import { preloadTheme, ThemeProvider } from "@deephaven/components";

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
  },
  {
    path: "/iframe",
    element: <IFrameApp />,
  },
]);

// Preload any cached theme variables to avoid a flash of unstyled content
preloadTheme();

ReactDOM.render(
  <React.StrictMode>
    <ThemeProvider themes={null}>
      <RouterProvider router={router} />
    </ThemeProvider>
  </React.StrictMode>,
  document.getElementById("root")
);
