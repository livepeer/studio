import isoFetch from "isomorphic-fetch";

import schema from "./schema/schema.json";
import { TestServer } from "./test-server";

/**
 * Clear the entire database! Not to be used outside of tests
 */
export async function clearDatabase(server: TestServer) {
  const tables = Object.values(schema.components.schemas)
    .map((s) => ("table" in s ? s.table : null))
    .filter((t) => !!t);
  await Promise.all(tables.map((t) => server.db.query(`TRUNCATE TABLE ${t}`)));
}

export class TestClient {
  server: TestServer;
  apiKey: string;
  jwtAuth: string;
  googleAuthorization: string;

  constructor(opts: {
    server: TestServer;
    apiKey?: string;
    jwtAuth?: string;
    googleAuthorization?: string;
  }) {
    if (!opts.server) {
      throw new Error("TestClient missing server");
    }

    this.server = opts.server;

    if (opts.apiKey) {
      this.apiKey = opts.apiKey;
    }
    if (opts.jwtAuth) {
      this.jwtAuth = opts.jwtAuth;
    }
    if (opts.googleAuthorization) {
      this.googleAuthorization = opts.googleAuthorization;
    }
  }

  async fetch(path, args: RequestInit = {}) {
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

  async get(path: string) {
    return await this.fetch(path, { method: "GET" });
  }

  async delete(path: string) {
    const params = {
      method: "DELETE",
    };
    return await this.fetch(path, params);
  }

  async post(path: string, data: any) {
    const params: RequestInit = {
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

  async put(path: string, data: any) {
    const params: RequestInit = {
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

  async patch(path: string, data: any) {
    const params: RequestInit = {
      method: "PATCH",
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
