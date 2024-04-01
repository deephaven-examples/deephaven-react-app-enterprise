import dh from "@deephaven/jsapi-shim"; // Import the shim to use the JS API

export const CLIENT_TIMEOUT = 60_000;

export const QUERY_TIMEOUT = 10_000;

/**
 * Wait for Deephaven client to be connected
 * @param client Deephaven client object
 * @returns When the client is connected, rejects on timeout
 */
export function clientConnected(client: any): Promise<void> {
  return new Promise((resolve, reject) => {
    if (client.isConnected) {
      resolve();
      return;
    }

    const timer = setTimeout(() => {
      reject(new Error("Timeout waiting for connect"));
    }, CLIENT_TIMEOUT);

    client.addEventListener((dh as any).Client.EVENT_CONNECT, () => {
      resolve();
      clearTimeout(timer);
    });
  });
}

/**
 * Fetch a query. Must provide the serial or the configuration type
 * @param client Client to fetch from
 * @param serial The query serial to fetch
 * @param configurationType The configuration type of query to fetch
 * @returns Query object
 */
export function loadQuery(
  client: any,
  serial?: string,
  configurationType?: string
): any {
  console.log(`Fetching query ${serial}, ${configurationType}...`);

  return new Promise((resolve, reject) => {
    if (!serial && !configurationType) {
      reject(new Error("Must provide serial or configuration type"));
      return;
    }

    let removeListener: () => void;

    const timeout = setTimeout(() => {
      reject(new Error(`Query not found, ${serial}`));
      removeListener();
    }, QUERY_TIMEOUT);

    function resolveIfQueryFound(queries: any[]) {
      const matchingQuery = queries.find(
        (query) =>
          query.serial === serial ||
          (!serial && query.configurationType === configurationType)
      );

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
      (dh as any).Client.EVENT_CONFIG_ADDED,
      listener
    );
    const initialQueries = client.getKnownConfigs();
    resolveIfQueryFound(initialQueries);
  });
}

/**
 * Load an existing Deephaven table with the client and query name provided
 * Needs to listen for when queries are added to the list as they are not known immediately after connecting.
 * @param client The Deephaven client object
 * @param querySerial Serial of the query to load
 * @param tableName Name of the table to load
 * @returns Deephaven table
 */
export async function loadTable(
  client: any,
  querySerial: string,
  tableName: string
) {
  console.log(`Fetching query ${querySerial}, table ${tableName}...`);

  const query = await loadQuery(client, querySerial);
  return query.getTable(tableName);
}
