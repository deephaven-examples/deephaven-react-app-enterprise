import React, { useCallback, useEffect, useState } from "react";
import { LoadingOverlay } from "@deephaven/components"; // Use the loading spinner from the Deephaven components package
import dh from "@deephaven/jsapi-shim"; // Import the shim to use the JS API
import "./App.scss"; // Styles for in this app
import {
  LOGIN_OPTIONS_REQUEST,
  isMessage,
  makeResponse,
} from "@deephaven/jsapi-utils";
import { EnterpriseClient } from "@deephaven-enterprise/jsapi-types";
import {
  clientConnected,
  getQuery,
  getWebsocketUrl,
  isCorePlusQuery,
} from "./Utils";

const API_URL = import.meta.env.VITE_DEEPHAVEN_API_URL ?? "";

const USER = import.meta.env.VITE_DEEPHAVEN_USER ?? "";

const PASSWORD = import.meta.env.VITE_DEEPHAVEN_PASSWORD ?? "";

const WIDTH = 800;
const HEIGHT = 600;

const enterpriseApi = dh as EnterpriseDhType;

/**
 * A functional React component that opens an IFrame to a table in a specified Core+ PQ. Will pass the authentication details to the IFrame so it does not need to login.
 * Query params are required in the URL:
 * - `query`: Name of the query to open.
 * - `widget`: Name of the widget to open. Could be a table, figure, or any type of widget.
 * E.g. http://localhost:3000/iframe/?query=DemoQuery&widget=my_table will attempt to open a table `my_table` from the `DemoQuery` Persistent Query.
 * By default, tries to connect to the server defined in the REACT_APP_CORE_API_URL variable, which is set to http://localhost:8123/irisapi
 * See create-react-app docs for how to update these env vars: https://create-react-app.dev/docs/adding-custom-environment-variables/
 */
function App() {
  const [iframeUrl, setIframeUrl] = useState<string>();
  const [error, setError] = useState<string>();
  const [isLoading, setIsLoading] = useState(true);
  const [client, setClient] = useState<EnterpriseClient>();
  const iframeRef = React.useRef<HTMLIFrameElement>(null);

  const initApp = useCallback(async () => {
    try {
      // Connect to the Web API server
      const baseUrl = new URL(API_URL ?? "", `${window.location}`);

      const websocketUrl = getWebsocketUrl(baseUrl);

      console.log(`Creating client ${websocketUrl}...`);

      const client = new enterpriseApi.Client(websocketUrl.href);

      setClient(client);

      await clientConnected(client);

      await client.login({ username: USER, token: PASSWORD, type: "password" });

      // Get the table name from the search params `queryName` and `tableName`.
      const searchParams = new URLSearchParams(window.location.search);
      const queryName = searchParams.get("queryName") ?? "";
      const widgetName = searchParams.get("widgetName") ?? "";
      if (queryName === "" || widgetName === "") {
        throw new Error(
          "Missing query or widget name in URL. Please provide the 'queryName' and 'widgetName' query params in the URL."
        );
      }

      // Get the PQ specified by the query name
      const query = await getQuery(client, queryName);
      console.log("Query successfully loaded!", query);

      if (query.status !== "Running") {
        throw new Error(`Query ${queryName} is not running`);
      }

      const serverConfigValues = await client.getServerConfigValues();
      if (!isCorePlusQuery(query, serverConfigValues.workerKinds)) {
        throw new Error(`Query ${queryName} is not a Core+ query`);
      }

      const { envoyPrefix } = query;
      const envoyParam = envoyPrefix ? `&envoyPrefix=${envoyPrefix}` : "";

      // Build the URL for the IFrame URL
      // ../iframe/widget/ is the path to the IFrame widget relative to the IDE Url
      // The authProvider=parent parameter tells the IFrame to use the parent's (e.g. this window's) authentication.
      // The name parameter specifies the widget to open
      const newUrl = new URL(
        `../iframe/widget/?authProvider=parent&name=${widgetName}${envoyParam}`,
        query.ideUrl
      );
      console.log("Setting IFrame URL to", newUrl.href);
      setIframeUrl(newUrl.href);
    } catch (e) {
      console.error("Unable to find query", e);
      setError(`${e}`);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    initApp();
  }, [initApp]);

  useEffect(() => {
    return () => {
      // On unmount, disconnect the client we created (which cleans up the session)
      client?.disconnect();
    };
  }, [client]);

  /**
   * Handle an authentication request.
   * First check if it's from the IFrame, and if it is a valid request, generate an auth token and send it to the IFrame.
   */
  const handleAuthentication = useCallback(
    async (event: MessageEvent<unknown>) => {
      const { data, source, origin } = event;
      // Check that it's coming from the IFrame we created
      if (
        source == null ||
        iframeRef.current == null ||
        source !== iframeRef.current?.contentWindow
      ) {
        console.log("Ignore message, invalid event source", source);
        return;
      }

      // Check if it's a message that we recognize
      if (!isMessage(data) || data.message !== LOGIN_OPTIONS_REQUEST) {
        console.log("Ignore message, invalid message", data);
        return;
      }

      if (client == null) {
        console.error("Client not initialized");
        return;
      }

      // Create the auth token to send back
      const token = await client.createAuthToken("RemoteQueryProcessor");

      // Create the LoginOptions object to send back
      const loginOptions = {
        type: "io.deephaven.proto.auth.Token",
        token,
      };

      // Send the token back to the IFrame
      source.postMessage(makeResponse(data.id, loginOptions), origin);
    },
    [client]
  );

  // Wire up our listener for authentication requests
  useEffect(() => {
    window.addEventListener("message", handleAuthentication);
    return () => {
      window.removeEventListener("message", handleAuthentication);
    };
  }, [handleAuthentication]);

  const isLoaded = iframeUrl != null;

  return (
    <div className="App">
      <h1>Deephaven IFrame</h1>
      {isLoaded && (
        <iframe
          src={iframeUrl}
          title="Deephaven IFrame"
          width={WIDTH}
          height={HEIGHT}
          ref={iframeRef}
        />
      )}
      {!isLoaded && (
        <LoadingOverlay
          isLoaded={isLoaded}
          isLoading={isLoading}
          errorMessage={error ? error : null}
        />
      )}
    </div>
  );
}

export default App;
