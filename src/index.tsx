import React from "react";
import ReactDOM from "react-dom";
import { Provider } from "react-redux";
import { store } from "@deephaven/redux";

// Fira fonts are not necessary, but look the best
import "fira";

// Need to import the base style sheet for proper styling
import "@deephaven/components/scss/BaseStyleSheet.scss";
import "./index.scss";
import App from "./App";

ReactDOM.render(
  <React.StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </React.StrictMode>,
  document.getElementById("root")
);
