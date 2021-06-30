import express, { Express } from "express";
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

export interface AuxTestServer {
  app: Express;
  port: number;
  close: () => Promise<void>;
}

export function startAuxTestServer(port?: number) {
  const app = express();
  const listener = port ? app.listen(port) : app.listen();
  const close = () =>
    new Promise<void>((resolve, reject) => {
      listener.close((err) => {
        return err ? reject(err) : resolve();
      });
    });

  return new Promise<AuxTestServer>((resolve, reject) => {
    listener.on("error", reject);
    listener.on("listening", () => {
      const addr = listener.address();
      if (!addr || typeof addr === "string") {
        listener.close();
        return reject(new Error("Unexpected non-AddressInfo listener address"));
      }
      const { port } = addr;
      console.log("Aux test server listening at http://localhost:%s", port);

      resolve({ app, close, port });
    });
  });
}

export class TestClient {
  server: TestServer;
  apiKey: string;
  jwtAuth: string;
  basicAuth: string;
  googleAuthorization: string;

  constructor(opts: {
    server: TestServer;
    apiKey?: string;
    jwtAuth?: string;
    basicAuth?: string;
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
    if (opts.basicAuth) {
      this.basicAuth = opts.basicAuth;
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
    if (this.basicAuth) {
      const basic64 = Buffer.from(this.basicAuth).toString("base64");
      headers = {
        ...headers,
        authorization: `Basic ${basic64}`,
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
