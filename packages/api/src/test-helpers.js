import isoFetch from "isomorphic-fetch";
import schema from "./schema/schema.json";

/**
 * Clear the entire database! Not to be used outside of tests
 */
export async function clearDatabase(server) {
  const tables = Object.values(schema.components.schemas)
    .filter((x) => x.table)
    .map((x) => x.table);
  await Promise.all(tables.map((t) => server.db.query(`TRUNCATE TABLE ${t}`)));
}

export class TestClient {
  constructor(opts) {
    if (!opts.server) {
      throw new Error("TestClient missing server");
    }

    this.server = opts.server;

    if (opts.apiKey) {
      this.apiKey = opts.apiKey;
    }
    this.jwtAuth = "";

    if (opts.googleAuthorization) {
      this.googleAuthorization = opts.googleAuthorization;
    }
  }

  async fetch(path, args = {}) {
    let headers = args.headers || {};
    if (this.apiKey) {
      headers = {
        ...headers,
        authorization: `Bearer ${this.apiKey}`,
      };
    }
    if (this.jwtAuth) {
      headers = {
        ...headers,
        authorization: `JWT ${this.jwtAuth}`,
      };
    }
    const res = await isoFetch(
      `${this.server.host}${this.server.httpPrefix}${path}`,
      {
        ...args,
        headers,
      }
    );
    return res;
  }

  async get(path) {
    return await this.fetch(path, { method: "GET" });
  }

  async delete(path) {
    const params = {
      method: "DELETE",
    };
    return await this.fetch(path, params);
  }

  async post(path, data) {
    const params = {
      method: "POST",
    };
    if (data) {
      params.headers = {
        "content-type": "application/json",
      };
      params.body = JSON.stringify(data);
    }
    return await this.fetch(path, params);
  }

  async put(path, data) {
    const params = {
      method: "PUT",
    };
    if (data) {
      params.headers = {
        "content-type": "application/json",
      };
      params.body = JSON.stringify(data);
    }
    return await this.fetch(path, params);
  }
}
