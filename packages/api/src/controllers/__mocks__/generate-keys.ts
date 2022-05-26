export {};

const lib = jest.requireActual("../generate-keys");

let state = {
  pendingResults: [],
  failOnMissingResult: false,
};

lib.__reset = () => {
  state.pendingResults = [];
  state.failOnMissingResult = false;
};

lib.__addResult = (...results: string[]) => {
  state.pendingResults.push(...results);
};

lib.__failOnMissingResult = (doFail = true) => {
  state.failOnMissingResult = doFail;
};

const origGenKey = lib.randomKey.generate;
lib.randomKey.generate = (): Promise<string> => {
  if (!state.pendingResults.length) {
    if (state.failOnMissingResult) {
      throw new Error("mock: no key to return");
    }
    return origGenKey();
  }
  return Promise.resolve(state.pendingResults.shift());
};

module.exports = lib;
