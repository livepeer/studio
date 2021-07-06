export * from "node-fetch";

import realFetch from "node-fetch";

let mocks = {};

export const setMock = (url, responseGenerator) => {
  mocks[url] = responseGenerator;
};
export const clearMocks = () => {
  mocks = {};
};

export default async function fetch(url, params) {
  if (mocks[url]) {
    return mocks[url]();
  }
  return realFetch(url, params);
}
