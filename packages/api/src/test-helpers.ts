import express, { Express } from "express";
import fetch, { RequestInit } from "node-fetch";
import { v4 as uuid } from "uuid";

import schema from "./schema/schema.json";
import { User } from "./schema/types";
import { TestServer } from "./test-server";

const vhostUrl = (vhost: string) =>
  `http://guest:guest@localhost:15672/api/vhosts/${vhost}`;

export const rabbitMgmt = {
  createVhost: (vhost: string) => fetch(vhostUrl(vhost), { method: "PUT" }),
  deleteVhost: (vhost: string) => fetch(vhostUrl(vhost), { method: "DELETE" }),
};

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
  host: string;
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
      const host = `http://127.0.0.1:${port}`;
      console.log(`Aux test server listening at ${host}`);

      resolve({ app, host, port, close });
    });
  });
}

export class TestClient {
  server: { host: string; httpPrefix: string };
  apiKey: string;
  jwtAuth: string;
  basicAuth: string;
  googleAuthorization: string;

  constructor(opts: {
    server: TestServer | { host: string; httpPrefix?: string };
    apiKey?: string;
    jwtAuth?: string;
    basicAuth?: string;
    googleAuthorization?: string;
  }) {
    if (!opts.server) {
      throw new Error("TestClient missing server");
    }

    this.server = {
      host: opts.server.host,
      httpPrefix: (opts.server.httpPrefix as string) ?? "",
    };

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

  async fetch(path: string, args: RequestInit = {}) {
    let headers = args.headers || {};
    if (this.apiKey) {
      headers = {
        authorization: `Bearer ${this.apiKey}`,
        ...headers,
      };
    }
    if (this.jwtAuth) {
      headers = {
        authorization: `JWT ${this.jwtAuth}`,
        ...headers,
      };
    }
    if (this.basicAuth) {
      const basic64 = Buffer.from(this.basicAuth).toString("base64");
      headers = {
        authorization: `Basic ${basic64}`,
        ...headers,
      };
    }
    const res = await fetch(
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

  async delete(path: string, data?: any) {
    const params: RequestInit = {
      method: "DELETE",
    };
    if (data) {
      params.headers = {
        "content-type": "application/json",
      };
      params.body = JSON.stringify(data);
    }
    return await this.fetch(path, params);
  }

  async post(path: string, data?: any) {
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

export async function createUser(
  server: TestServer,
  client: TestClient,
  userData: User,
  admin: boolean,
  emailValid: boolean
) {
  const userRes = await client.post(`/user`, userData);
  let user = await userRes.json();

  const tokenRes = await client.post(`/user/token`, userData);
  const tokenJson = await tokenRes.json();
  const token = tokenJson.token;

  const storedUser = await server.store.get(`user/${user.id}`, false);
  user = { ...storedUser, admin, emailValid };
  await server.store.replace(user);

  const apiKey = uuid();
  await server.store.create({
    id: apiKey,
    kind: "api-token",
    userId: user.id,
  });
  return { user, token, apiKey };
}

export async function setupUsers(
  server: TestServer,
  admin: User,
  nonAdmin: User,
  emailValid = true
) {
  const client = new TestClient({ server });
  const {
    user: adminUser,
    token: adminToken,
    apiKey: adminApiKey,
  } = await createUser(server, client, admin, true, emailValid);
  const {
    user: nonAdminUser,
    token: nonAdminToken,
    apiKey: nonAdminApiKey,
  } = await createUser(server, client, nonAdmin, false, emailValid);

  return {
    client,
    adminUser,
    adminToken,
    adminApiKey,
    nonAdminUser,
    nonAdminToken,
    nonAdminApiKey,
  };
}
