import React from "react";
import ReactDOM from "react-dom";
import { Provider } from "react-redux";
import "@deephaven/components/scss/BaseStyleSheet.scss";
import { ApiContext } from "@deephaven/jsapi-bootstrap";
import dh from "@deephaven/jsapi-shim";
import { store } from "@deephaven/redux";
import App from "./App.tsx";
import "./index.css";

ReactDOM.render(
  <ApiContext.Provider value={dh}>
    <Provider store={store}>
      <App />
    </Provider>
  </ApiContext.Provider>,
  document.getElementById("root")
);
