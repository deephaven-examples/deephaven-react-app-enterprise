import React, { useCallback, useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { LoadingOverlay } from "@deephaven/components"; // Use the loading spinner from the Deephaven components package
import Dashboard, {
  DehydratedPanelProps,
  setDashboardData,
} from "@deephaven/dashboard";
import { GridPlugin, LinkerPlugin } from "@deephaven/dashboard-core-plugins";
import {
  IrisGridModel,
  IrisGridModelFactory,
  IrisGridThemeType,
} from "@deephaven/iris-grid"; // iris-grid is used to display Deephaven tables
import dh from "@deephaven/jsapi-shim"; // Import the shim to use the JS API
import { setUser, setWorkspace } from "@deephaven/redux";
import { clientConnected, loadDashboard, loadTable } from "./Utils";
import IrisGridTheme from "./IrisGridTheme";

// Dashboard data stores the links
import DefaultDashboardData from "./json/DashboardData.json";

// Layout config stores the position and content of all the panels
import DefaultLayoutConfig from "./json/LayoutConfig.json";

// Layout settings control whether panels can be moved or closed or have headers
import DefaultLayoutSettings from "./json/LayoutSettings.json";

// The default user workspace stores some of the app settings used by some panels
import DefaultWorkspace from "./json/Workspace.json";

import "./App.scss"; // Styles for in this app

const API_URL = import.meta.env.VITE_DEEPHAVEN_API_URL ?? "";

const USER = import.meta.env.VITE_DEEPHAVEN_USER ?? "";

const PASSWORD = import.meta.env.VITE_DEEPHAVEN_PASSWORD ?? "";

const DASHBOARD_ID = "Default";

console.log("API_URL", API_URL);

/**
 * A functional React component that displays a Deephaven table in an IrisGrid using the @deephaven/iris-grid package.
 * If the query param `tableName` is provided, it will attempt to open and display that table, expecting it to be present on the server.
 * E.g. http://localhost:3000/?tableName=myTable will attempt to open a table `myTable`
 * If no query param is provided, it will attempt to open a new session and create a basic time table and display that.
 * By default, tries to connect to the server defined in the VITE_CORE_API_URL variable, which is set to http://localhost:1000/jsapi
 * See create-react-app docs for how to update these env vars: https://create-react-app.dev/docs/adding-custom-environment-variables/
 */
function App() {
  const [error, setError] = useState<string>();
  const [isLoading, setIsLoading] = useState(true);
  const [client, setClient] = useState<any>();
  const [layoutConfig, setLayoutConfig] = useState<any>();
  const dispatch = useDispatch();

  const initApp = useCallback(async () => {
    try {
      // Connect to the Web API server
      const baseUrl = new URL(API_URL ?? "", `${API_URL}`);

      const websocketUrl = new URL("/socket", baseUrl);
      if (websocketUrl.protocol === "http:") {
        websocketUrl.protocol = "ws:";
      } else {
        websocketUrl.protocol = "wss:";
      }

      console.log(`Creating client ${websocketUrl}...`);

      const client = new (dh as any).Client(websocketUrl.href);

      setClient(client);

      await clientConnected(client);

      await client.login({ username: USER, token: PASSWORD, type: "password" });

      let newDashboardData = DefaultDashboardData;
      let newLayoutConfig = DefaultLayoutConfig;
      const searchParams = new URLSearchParams(window.location.search);
      const workspaceDashboardId = searchParams.get("dashboard");
      if (workspaceDashboardId) {
        // If a dashboard ID was provided in the URL param, load that one
        const dashboard = await loadDashboard(client, workspaceDashboardId);
        console.log("loadDashboard dashboard is", dashboard);

        newDashboardData = dashboard.data;
        newLayoutConfig = dashboard.config;
      }

      // Set the redux values needed for dashboards to function
      dispatch(setWorkspace(DefaultWorkspace as any));
      dispatch(setDashboardData(DASHBOARD_ID, newDashboardData));
      // TODO: Pull from server
      dispatch(
        setUser({
          name: USER,
          operateAs: USER,
          groups: [],
          permissions: {},
        } as any)
      );
      setLayoutConfig(newLayoutConfig);
    } catch (e) {
      console.error("Unable to load table", e);
      setError(`${e}`);
    }
    setIsLoading(false);
  }, [dispatch]);

  /**
   * Hydrate the grid from a dehydrated state.
   * Takes the serialized props and loads the table from the server into a model
   */
  const hydrateGrid = useCallback(
    (
      props: DehydratedPanelProps
    ): DehydratedPanelProps & {
      localDashboardId: string;
      makeModel: () => Promise<IrisGridModel>;
      theme: Partial<IrisGridThemeType>;
    } => {
      const { metadata } = props;
      const { querySerial, table: tableName } = metadata as any;
      const makeModel = async () => {
        const table = await loadTable(client, querySerial, tableName);
        return IrisGridModelFactory.makeModel(dh, table);
      };
      return {
        metadata: {},
        ...props,
        localDashboardId: DASHBOARD_ID,
        theme: IrisGridTheme,
        makeModel,
      };
    },
    [client]
  );

  useEffect(() => {
    initApp();
  }, [initApp]);

  useEffect(() => {
    return () => {
      // On unmount, disconnect the client we created (which cleans up the session)
      client?.disconnect();
    };
  }, [client]);

  return (
    <div className="App">
      {!isLoading && (
        <Dashboard
          id={DASHBOARD_ID}
          layoutConfig={layoutConfig}
          layoutSettings={DefaultLayoutSettings}
        >
          <GridPlugin hydrate={hydrateGrid} />
          <LinkerPlugin />
        </Dashboard>
      )}
      <LoadingOverlay
        isLoaded={!isLoading}
        isLoading={isLoading}
        errorMessage={error ? error : null}
      />
    </div>
  );
}

export default App;
