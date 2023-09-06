import React from "react";
import ReactDOM from "react-dom";
import { Provider } from "react-redux";
import "@deephaven/components/scss/BaseStyleSheet.scss";
import { ApiContext } from "@deephaven/jsapi-bootstrap";
import dh from "@deephaven/jsapi-shim";
import { store } from "@deephaven/redux";
import "./index.css";
import App from "./App";
import reportWebVitals from "./reportWebVitals";

ReactDOM.render(
  <ApiContext.Provider value={dh}>
    <Provider store={store}>
      <App />
    </Provider>
  </ApiContext.Provider>,
  document.getElementById("root")
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
