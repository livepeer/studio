import express from "express";
import fetch from "isomorphic-fetch";

describe("webhook cannon", () => {
  let server;
  let listener;
  let testHost;
  beforeEach(async () => {
    server = express();
    return new Promise<void>((resolve, reject) => {
      listener = server.listen(30000, function (err) {
        if (err) {
          return reject(err);
        }
        const port = listener.address().port;
        testHost = `http://localhost:${port}`;
        console.log("Example app listening at http://%s", testHost);
        resolve();
      });
    });
  });

  afterEach(() => {
    listener.close();
  });

  it("should have a test server", async () => {
    server.get("/self-test", (req, res) => {
      res.end("self test was good");
    });
    const res = await fetch(`${testHost}/self-test`);
    const text = await res.text();
    expect(text).toEqual("self test was good");
  });
});
