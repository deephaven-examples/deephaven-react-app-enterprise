import React from "react";
import ReactDOM from "react-dom";

// Need to import the base style sheet for proper styling
import "@deephaven/components/scss/BaseStyleSheet.scss";
import App from "./App";

ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById("root")
);
