import fetch, { RequestInit, Response } from "node-fetch";

// extend requestinit with timeout parameter
export interface RequestInitWithTimeout extends RequestInit {
  timeout?: number;
}

export const timeout = <T>(ms: number, fn: () => Promise<T>) => {
  return new Promise<T>((resolve, reject) => {
    const handle = setTimeout(() => {
      reject(Error("timed out"));
    }, ms);

    fn()
      .then((...ret) => {
        clearTimeout(handle);
        resolve(...ret);
      })
      .catch((err) => {
        clearTimeout(handle);
        reject(err);
      });
  });
};

export const sleep = (duration) => {
  return new Promise((resolve) => {
    setTimeout(resolve, duration);
  });
};

export const semaphore = () => {
  let resolvePromise;
  const promise = new Promise((resolve) => {
    resolvePromise = resolve;
  });
  return {
    release: () => {
      resolvePromise();
    },
    wait: (timeoutMs) => {
      if (!timeoutMs) return promise;
      return Promise.race([promise, sleep(timeoutMs)]);
    },
  };
};

/**
 * Returns the input array, shuffled.
 */
export const shuffle = <T>(arr: T[]) => {
  const randos = arr.map(() => Math.random());
  return Object.keys(arr)
    .sort((idx1, idx2) => {
      return randos[idx1] - randos[idx2];
    })
    .map<T>((idx) => arr[idx]);
};

export const fetchWithTimeout = (
  url: string,
  options: RequestInitWithTimeout
) =>
  new Promise<Response>((resolve, reject) => {
    let timeout = setTimeout(() => {
      timeout = null;
      reject("timeout");
    }, options.timeout || 10 * 1000);
    return fetch(url, options).then(
      (response) => {
        if (timeout === null) {
          // already timed out
          return;
        }
        clearTimeout(timeout);
        return resolve(response);
      },
      (rejectReason) => {
        if (timeout === null) {
          // already timed out
          return;
        }
        clearTimeout(timeout);
        return reject(rejectReason);
      }
    );
  });

// turns foo-bar-baz into fooBarBaz
export const kebabToCamel = (str: string) => {
  let out = "";
  let upper = false;
  for (let i = 0; i < str.length; i += 1) {
    const char = str[i];
    if (char === "-") {
      upper = true;
    } else if (upper === true) {
      out += char.toUpperCase();
      upper = false;
    } else {
      out += char;
    }
  }
  return out;
};
