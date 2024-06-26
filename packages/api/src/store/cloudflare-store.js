import fetch from "node-fetch";
import querystring from "querystring";
import { NotFoundError } from "./errors";

const CLOUDFLARE_URL = "https://api.cloudflare.com/client/v4/accounts";
const DEFAULT_LIMIT = 10;
const retryLimit = 3;
let namespace;
let accountId;
let auth;

export default class CloudflareStore {
  constructor({ cloudflareNamespace, cloudflareAccount, cloudflareAuth }) {
    if (!cloudflareNamespace || !cloudflareAccount || !cloudflareAuth) {
      throw new Error(
        "no cloudflare namespace, account id, or authorization key provided",
      );
    }
    namespace = cloudflareNamespace;
    accountId = cloudflareAccount;
    auth = cloudflareAuth;
  }

  async listKeys(prefix = "", cursor = null, limit = DEFAULT_LIMIT) {
    const params = querystring.stringify({
      limit: limit,
      prefix: prefix,
      cursor: cursor,
    });

    const reqUrl = `${CLOUDFLARE_URL}/${accountId}/storage/kv/namespaces/${namespace}/keys?${params}`;
    const respData = await cloudflareFetch(reqUrl);
    const keys = [];
    for (let i = 0; i < respData.result.length; i++) {
      keys.push(respData.result[i].name);
    }
    return [keys, respData.result_info.cursor];
  }

  async list(prefix = "", cursor = null, limit = DEFAULT_LIMIT) {
    const [keys, newCursor] = await this.listKeys(prefix, cursor, limit);
    const values = [];
    for (let i = 0; i < keys.length; i++) {
      const reqUrl = `${CLOUDFLARE_URL}/${accountId}/storage/kv/namespaces/${namespace}/values/${keys[i]}`;
      const resp = await cloudflareFetch(reqUrl);
      await sleep(200);
      values.push({ [keys[i]]: resp });
    }

    return { data: values, cursor: newCursor };
  }

  async get(value) {
    const reqUrl = `${CLOUDFLARE_URL}/${accountId}/storage/kv/namespaces/${namespace}/values/${value}`;
    const respData = await cloudflareFetch(reqUrl);

    return respData;
  }

  async create(key, data) {
    const reqUrl = `${CLOUDFLARE_URL}/${accountId}/storage/kv/namespaces/${namespace}/values/${key}`;
    const respData = await cloudflareFetch(reqUrl, {
      data: data,
      method: "PUT",
      retries: 0,
    });
    return respData;
  }

  async replace(key, data) {
    const reqUrl = `${CLOUDFLARE_URL}/${accountId}/storage/kv/namespaces/${namespace}/values/${key}`;
    const resp = await cloudflareFetch(reqUrl, {
      data: data,
      method: "PUT",
      retries: 0,
    });
    if (!resp) {
      throw new NotFoundError();
    }
  }

  async delete(id) {
    const reqUrl = `${CLOUDFLARE_URL}/${accountId}/storage/kv/namespaces/${namespace}/values/${id}`;
    const resp = await cloudflareFetch(reqUrl, {
      data: null,
      method: "DELETE",
      retries: 0,
    });
    if (!resp) {
      throw new NotFoundError();
    }
  }
}

async function cloudflareFetch(
  reqUrl,
  { method = "GET", retries = 0, data = null } = {},
) {
  const req = {
    method: method,
    headers: {
      authorization: `Bearer ${auth}`,
    },
  };
  if (data) {
    req.body = JSON.stringify(data);
  }

  const res = await fetch(reqUrl, req);
  const respData = await res.json();

  if (res.status != 200) {
    const errorMessage = `Cloudflare ${res.status} error: ${
      res.statusText
    }, error_messages: ${JSON.stringify(respData.errors)}`;
    console.log(errorMessage);

    if (res.status == 404) {
      return null;
    } else if (res.status == 429) {
      console.log("Sleeping for 3 seconds");
      await sleep(3000);
      if (retries < retryLimit) {
        retries++;
        await cloudflareFetch(reqUrl, {
          data: data,
          method: method,
          retries: retries,
        });
      } else {
        throw new Error(errorMessage);
      }
    }

    return respData;
  }

  return respData;
}

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
