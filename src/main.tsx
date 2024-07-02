import React from "react";
import ReactDOM from "react-dom";
import { RouterProvider, createBrowserRouter } from "react-router-dom";

// Need to import the base style sheet for proper styling
import "@deephaven/components/scss/BaseStyleSheet.scss";
import App from "./App";
import IFrameApp from "./IFrameApp";

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

ReactDOM.render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
  document.getElementById("root")
);
