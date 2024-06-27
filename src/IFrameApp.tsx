import React, { useCallback, useEffect, useState } from "react";
import { LoadingOverlay } from "@deephaven/components"; // Use the loading spinner from the Deephaven components package
import dh from "@deephaven/jsapi-shim"; // Import the shim to use the JS API
import "./App.scss"; // Styles for in this app
import {
  LOGIN_OPTIONS_REQUEST,
  isMessage,
  makeResponse,
} from "@deephaven/jsapi-utils";

const CLIENT_TIMEOUT = 60_000;

const API_URL = import.meta.env.VITE_DEEPHAVEN_API_URL ?? "";

const USER = import.meta.env.VITE_DEEPHAVEN_USER ?? "";

const PASSWORD = import.meta.env.VITE_DEEPHAVEN_PASSWORD ?? "";

const WIDTH = 800;
const HEIGHT = 600;

/**
 * Wait for Deephaven client to be connected
 * @param client Deephaven client object
 * @returns When the client is connected, rejects on timeout
 */
function clientConnected(client: any): Promise<void> {
  return new Promise((resolve, reject) => {
    if (client.isConnected) {
      resolve();
      return;
    }

    const timer = setTimeout(() => {
      reject(new Error("Timeout waiting for connect"));
    }, CLIENT_TIMEOUT);

    client.addEventListener(dh.Client.EVENT_CONNECT, () => {
      resolve();
      clearTimeout(timer);
    });
  });
}

/**
 * Load an existing Deephaven table with the client and query name provided
 * Needs to listen for when queries are added to the list as they are not known immediately after connecting.
 * @param client The Deephaven client object
 * @param queryName Name of the query to load
 * @returns Deephaven table
 */
function getQuery(client: any, queryName: string): Promise<any> {
  console.log(`Fetching query ${queryName}`);

  return new Promise((resolve, reject) => {
    let removeListener: () => void;

    const timeout = setTimeout(() => {
      reject(new Error(`Query not found, ${queryName}`));
      removeListener();
    }, 10000);

    function resolveIfQueryFound(queries: any[]) {
      const matchingQuery = queries.find((query) => query.name === queryName);

      if (matchingQuery) {
        resolve(matchingQuery);
        clearTimeout(timeout);
        removeListener();
      }
    }

    function listener(event: any) {
      const addedQueries = [event.detail];
      resolveIfQueryFound(addedQueries);
    }

    removeListener = client.addEventListener(
      dh.Client.EVENT_CONFIG_ADDED,
      listener
    );
    const initialQueries = client.getKnownConfigs();
    resolveIfQueryFound(initialQueries);
  });
}

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
  const [client, setClient] = useState<any>();
  const iframeRef = React.useRef<HTMLIFrameElement>(null);

  const initApp = useCallback(async () => {
    try {
      // Connect to the Web API server
      const baseUrl = new URL(API_URL ?? "", `${window.location}`);

      const websocketUrl = new URL("/socket", baseUrl);
      if (websocketUrl.protocol === "http:") {
        websocketUrl.protocol = "ws:";
      } else {
        websocketUrl.protocol = "wss:";
      }

      console.log(`Creating client ${websocketUrl}...`);

      const client = new dh.Client(websocketUrl.href);

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

      // Build the URL for the IFrame URL
      // ../iframe/widget/ is the path to the IFrame widget relative to the IDE Url
      // The authProvider=parent parameter tells the IFrame to use the parent's (e.g. this window's) authentication.
      // The name parameter specifies the widget to open
      const newUrl = new URL(
        `../iframe/widget/?authProvider=parent&name=${widgetName}`,
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
